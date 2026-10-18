using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class MediaTests
{
    // A real 1×1 PNG.
    private static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    private static async Task<(HttpStatusCode Status, JsonElement Json)> Upload(HttpClient client, string? token, byte[] bytes, string fileName, string contentType = "image/png", int width = 1, int height = 1)
    {
        using MultipartFormDataContent form = new();
        ByteArrayContent file = new(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(file, "file", fileName);
        form.Add(new StringContent(width.ToString()), "width");
        form.Add(new StringContent(height.ToString()), "height");
        using HttpRequestMessage request = new(HttpMethod.Post, "/api/UploadImage") { Content = form };
        if (token != null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        HttpResponseMessage response = await client.SendAsync(request);
        string text = await response.Content.ReadAsStringAsync();
        return (response.StatusCode, text.Length > 0 ? JsonDocument.Parse(text).RootElement.Clone() : default);
    }

    [Fact]
    public async Task Images_upload_once_and_are_served_with_long_caching()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        (HttpStatusCode status, JsonElement json) = await Upload(session.Client, session.AccessToken, Png, "diagram.png");
        Assert.Equal(HttpStatusCode.OK, status);
        string url = json.GetProperty("data").GetProperty("url").GetString()!;
        Assert.Matches("^/media/[a-f0-9]{32}\\.png$", url);

        // The same bytes again: no second copy, same URL.
        (_, JsonElement again) = await Upload(session.Client, session.AccessToken, Png, "copy.png");
        Assert.Equal(url, again.GetProperty("data").GetProperty("url").GetString());
        JsonElement page = (await session.Client.Post("GetImages", new { }, token: session.AccessToken)).Data;
        Assert.Equal(1, page.GetProperty("totalCount").GetInt64());
        Assert.False(page.GetProperty("items")[0].TryGetProperty("data", out _));

        HttpClient visitor = factory.CreateApiClient();
        HttpResponseMessage served = await visitor.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal("image/png", served.Content.Headers.ContentType!.MediaType);
        Assert.Equal(Png, await served.Content.ReadAsByteArrayAsync());
        Assert.Equal("public, max-age=31536000, immutable", served.Headers.CacheControl!.ToString());
        Assert.Equal("nosniff", served.Headers.GetValues("X-Content-Type-Options").Single());

        using HttpRequestMessage conditional = new(HttpMethod.Get, url);
        conditional.Headers.TryAddWithoutValidation("If-None-Match", served.Headers.ETag!.Tag);
        Assert.Equal(HttpStatusCode.NotModified, (await visitor.SendAsync(conditional)).StatusCode);

        // A wrong extension or a malformed name is not found.
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(url.Replace(".png", ".webp"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/media/../appsettings.json")).StatusCode);

        string id = url[7..39];
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("DeleteImage", new { id }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(url)).StatusCode);
    }

    [Fact]
    public async Task Only_real_images_from_a_signed_in_admin_are_accepted()
    {
        using ApiFactory factory = new();
        HttpClient anonymous = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await Upload(anonymous, null, Png, "a.png")).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        byte[] svg = Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert(1)\"/>");
        Assert.Equal(HttpStatusCode.BadRequest, (await Upload(session.Client, session.AccessToken, svg, "x.svg", "image/svg+xml")).Status);
        byte[] html = Encoding.UTF8.GetBytes("<html><script>alert(1)</script></html>");
        Assert.Equal(HttpStatusCode.BadRequest, (await Upload(session.Client, session.AccessToken, html, "fake.png")).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Upload(session.Client, session.AccessToken, Png, "a.png", width: 0)).Status);

        byte[] huge = new byte[2 * 1024 * 1024 + 10];
        Png.CopyTo(huge, 0);
        Assert.NotEqual(HttpStatusCode.OK, (await Upload(session.Client, session.AccessToken, huge, "huge.png")).Status);
    }

    [Fact]
    public async Task Post_html_keeps_uploaded_images_with_lazy_loading()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        string html = "<figure><img src=\"/media/0123456789abcdef0123456789abcdef.webp\" alt=\"Diagram\" width=\"800\" height=\"450\" loading=\"lazy\" decoding=\"async\" onerror=\"alert(1)\"><figcaption>Flow</figcaption></figure>";
        object post = new { slug = "image-post", title = "Image post", excerpt = "x", content = html, date = "October 18, 2026", category = "DevOps", tags = new[] { "Test" }, isPublished = true };
        Assert.Equal(HttpStatusCode.OK, (await session.Client.Post("SavePost", post, token: session.AccessToken)).Status);
        string saved = (await session.Client.Post("GetPost", new { slug = "image-post" })).Data.GetProperty("content").GetString()!;
        Assert.Contains("src=\"/media/0123456789abcdef0123456789abcdef.webp\"", saved);
        Assert.Contains("loading=\"lazy\"", saved);
        Assert.Contains("decoding=\"async\"", saved);
        Assert.DoesNotContain("onerror", saved);
    }
}
