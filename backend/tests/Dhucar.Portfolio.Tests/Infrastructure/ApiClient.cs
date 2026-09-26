using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>Result of an API call: status code, envelope and raw response.</summary>
public sealed record ApiResult(HttpStatusCode Status, JsonElement Body, HttpResponseMessage Response)
{
    public int ReturnCode => Body.GetProperty("returnCode").GetInt32();

    public JsonElement Data => Body.GetProperty("data");
}

public static class ApiClient
{
    public static async Task<ApiResult> Post(this HttpClient client, string action, object? body = null, string? token = null, Dictionary<string, string>? headers = null)
    {
        using HttpRequestMessage request = new(HttpMethod.Post, $"/api/{action}")
        {
            Content = body is string raw ? new StringContent(raw, Encoding.UTF8, "application/json") : JsonContent.Create(body ?? new { }),
        };
        if (token != null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        foreach (KeyValuePair<string, string> header in headers ?? new())
        {
            request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }
        HttpResponseMessage response = await client.SendAsync(request);
        string text = await response.Content.ReadAsStringAsync();
        JsonElement json = text.Length > 0 ? JsonDocument.Parse(text).RootElement.Clone() : default;
        return new ApiResult(response.StatusCode, json, response);
    }
}
