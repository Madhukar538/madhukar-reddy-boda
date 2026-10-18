using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class AdminPagingTests
{
    [Fact]
    public async Task Admin_lists_page_and_search_on_the_server()
    {
        using ApiFactory factory = new();
        AdminSession session = await AdminSession.SignedIn(factory);
        HttpClient client = session.Client;
        string token = session.AccessToken;

        JsonElement first = (await client.Post("GetAllPosts", new { page = 1, pageSize = 5 }, token: token)).Data;
        JsonElement second = (await client.Post("GetAllPosts", new { page = 2, pageSize = 5 }, token: token)).Data;
        Assert.Equal(5, first.GetProperty("items").GetArrayLength());
        Assert.True(first.GetProperty("totalPages").GetInt32() >= 2);
        Assert.NotEqual(first.GetProperty("items")[0].GetProperty("id").GetString(), second.GetProperty("items")[0].GetProperty("id").GetString());
        // Lists carry no article bodies.
        Assert.False(first.GetProperty("items")[0].TryGetProperty("content", out _));

        JsonElement found = (await client.Post("GetAllPosts", new { search = "dgx spark" }, token: token)).Data;
        Assert.Contains(found.GetProperty("items").EnumerateArray(), x => x.GetProperty("id").GetString() == "rtx-5090-vs-dgx-spark-local-llm-inference");
        // Search text is matched literally, never as a pattern.
        Assert.Equal(0, (await client.Post("GetAllPosts", new { search = ".*" }, token: token)).Data.GetProperty("totalCount").GetInt64());

        JsonElement clients = (await client.Post("GetAllProjects", new { kind = "client", pageSize = 2 }, token: token)).Data;
        Assert.Equal(2, clients.GetProperty("items").GetArrayLength());
        Assert.All(clients.GetProperty("items").EnumerateArray(), x => Assert.Equal("client", x.GetProperty("kind").GetString()));
        string projectId = clients.GetProperty("items")[0].GetProperty("id").GetString()!;
        Assert.Equal(projectId, (await client.Post("GetProjectForEdit", new { id = projectId }, token: token)).Data.GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await client.Post("GetProjectForEdit", new { id = "nope" }, token: token)).Status);

        JsonElement options = (await client.Post("GetPostOptions", new { }, token: token)).Data;
        Assert.True(options.GetArrayLength() > 5);
        Assert.False(options[0].TryGetProperty("content", out _));

        HttpClient anonymous = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("GetAllPosts", new { })).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("GetPostForEdit", new { id = "x" })).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post("GetPostOptions", new { })).Status);
    }
}
