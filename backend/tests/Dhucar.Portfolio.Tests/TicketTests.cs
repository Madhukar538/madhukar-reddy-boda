using System.Net;
using System.Text.Json;
using Dhucar.Portfolio.Common.Security;
using Dhucar.Portfolio.Tests.Infrastructure;
using Xunit;

namespace Dhucar.Portfolio.Tests;

public class TicketTests
{
    private static object Ticket(string id, string priority = "P2", string title = "Checkout API times out under load") => new
    {
        id,
        name = "Asha",
        contact = "asha@example.com",
        category = "Performance",
        title,
        description = "p95 goes from 200 ms to 9 s at 300 rps.",
        urgency = "This week",
        stack = ".NET 8, SQL Server",
        link = "https://example.com/trace",
        page = "/blog/load-testing-microservices-k6-grafana",
        priority,
        triageReasons = new[] { "production impact", "performance" },
    };

    /// <summary>Posts a ticket the way the site does: HMAC over "timestamp.body" with the shared secret.</summary>
    private static Task<ApiResult> CreateSigned(HttpClient client, object ticket, string secret = ApiFactory.RevalidateSecret, long? at = null)
    {
        string body = JsonSerializer.Serialize(ticket, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        string timestamp = (at ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds()).ToString();
        return client.Post("CreateTicket", body, headers: new() { ["X-Timestamp"] = timestamp, ["X-Signature"] = RequestSigner.Sign(secret, timestamp, body) });
    }

    [Fact]
    public async Task Only_the_site_can_file_tickets()
    {
        using ApiFactory factory = new();
        HttpClient client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Post("CreateTicket", Ticket("BUG-261018-AAAAAA"))).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await CreateSigned(client, Ticket("BUG-261018-AAAAAA"), secret: "wrong-secret-0123456789-abcdefghijklmnop")).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await CreateSigned(client, Ticket("BUG-261018-AAAAAA"), at: DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeSeconds())).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await CreateSigned(client, Ticket("BUG-261018-AAAAAA", priority: "P9"))).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await CreateSigned(client, Ticket("not an id"))).Status);
        Assert.Equal(HttpStatusCode.OK, (await CreateSigned(client, Ticket("BUG-261018-AAAAAA"))).Status);
        // Only web links are kept from what a visitor typed.
        object scripted = new { id = "BUG-261018-CCCCCC", name = "X", contact = "x@example.com", category = "Bug", title = "T", description = "D", urgency = "Low", link = "javascript:alert(1)", priority = "P4" };
        Assert.Equal(HttpStatusCode.OK, (await CreateSigned(client, scripted)).Status);
        // A retried submission is accepted without a second copy.
        Assert.Equal(HttpStatusCode.OK, (await CreateSigned(client, Ticket("BUG-261018-AAAAAA"))).Status);

        AdminSession session = await AdminSession.SignedIn(factory);
        JsonElement all = (await session.Client.Post("GetTickets", new { status = "all" }, token: session.AccessToken)).Data;
        Assert.Equal(2, all.GetProperty("totalCount").GetInt64());
        JsonElement saved = (await session.Client.Post("GetTicket", new { id = "BUG-261018-CCCCCC" }, token: session.AccessToken)).Data;
        Assert.Equal(string.Empty, saved.GetProperty("link").GetString());
    }

    [Fact]
    public async Task Tickets_are_listed_updated_and_summarised()
    {
        using ApiFactory factory = new();
        HttpClient site = factory.CreateApiClient();
        await CreateSigned(site, Ticket("BUG-261018-P1AAAA", priority: "P1", title: "Payments failing"));
        await CreateSigned(site, Ticket("BUG-261018-P3AAAA", priority: "P3", title: "Typo in docs"));
        await CreateSigned(site, Ticket("BUG-261018-P2AAAA", priority: "P2"));

        AdminSession session = await AdminSession.SignedIn(factory);
        HttpClient client = session.Client;
        string token = session.AccessToken;

        JsonElement active = (await client.Post("GetTickets", new { }, token: token)).Data;
        Assert.Equal(3, active.GetProperty("totalCount").GetInt64());
        JsonElement p1 = (await client.Post("GetTickets", new { priority = "P1" }, token: token)).Data;
        Assert.Equal("Payments failing", Assert.Single(p1.GetProperty("items").EnumerateArray()).GetProperty("title").GetString());
        JsonElement found = (await client.Post("GetTickets", new { search = "typo" }, token: token)).Data;
        Assert.Equal("BUG-261018-P3AAAA", Assert.Single(found.GetProperty("items").EnumerateArray()).GetProperty("id").GetString());

        // Move one through the workflow with notes.
        Assert.Equal(HttpStatusCode.OK, (await client.Post("UpdateTicket", new { id = "BUG-261018-P1AAAA", status = "in-progress", note = "Reproduced with k6." }, token: token)).Status);
        Assert.Equal(HttpStatusCode.OK, (await client.Post("UpdateTicket", new { id = "bug-261018-p1aaaa", status = "resolved", priority = "P2" }, token: token)).Status);
        JsonElement ticket = (await client.Post("GetTicket", new { id = "BUG-261018-P1AAAA" }, token: token)).Data;
        Assert.Equal("resolved", ticket.GetProperty("status").GetString());
        Assert.Equal("P2", ticket.GetProperty("priority").GetString());
        Assert.Equal(JsonValueKind.String, ticket.GetProperty("resolvedAt").ValueKind);
        List<string> notes = ticket.GetProperty("notes").EnumerateArray().Select(x => x.GetProperty("text").GetString()!).ToList();
        Assert.Equal(["Changed status Open → In progress.", "Reproduced with k6.", "Changed status In progress → Resolved, priority P1 → P2."], notes);
        Assert.Equal("asha@example.com", ticket.GetProperty("contact").GetString());

        JsonElement summary = (await client.Post("GetTicketSummary", new { }, token: token)).Data;
        Assert.Equal(3, summary.GetProperty("total").GetInt64());
        Assert.Equal(2, summary.GetProperty("byStatus").GetProperty("open").GetInt64());
        Assert.Equal(1, summary.GetProperty("byStatus").GetProperty("resolved").GetInt64());
        Assert.Equal(1, summary.GetProperty("activeByPriority").GetProperty("P2").GetInt64());
        Assert.Equal(1, summary.GetProperty("activeByPriority").GetProperty("P3").GetInt64());
        Assert.Equal(3, summary.GetProperty("newLast7Days").GetInt64());
        Assert.Equal(JsonValueKind.Number, summary.GetProperty("averageResolutionHours").ValueKind);
        Assert.Equal("BUG-261018-P2AAAA", summary.GetProperty("recent")[0].GetProperty("id").GetString());

        ApiResult log = await client.Post("GetAuditLog", new { search = "ticket" }, token: token);
        Assert.Equal(2, log.Data.GetProperty("totalCount").GetInt64());
    }

    [Fact]
    public async Task Bad_updates_and_anonymous_access_are_refused()
    {
        using ApiFactory factory = new();
        await CreateSigned(factory.CreateApiClient(), Ticket("BUG-261018-BBBBBB"));
        AdminSession session = await AdminSession.SignedIn(factory);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("UpdateTicket", new { id = "BUG-261018-BBBBBB", status = "done" }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("UpdateTicket", new { id = "BUG-261018-BBBBBB" }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await session.Client.Post("UpdateTicket", new { id = "BUG-261018-BBBBBB", note = new string('x', 2001) }, token: session.AccessToken)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await session.Client.Post("GetTicket", new { id = "BUG-000000-NOPE00" }, token: session.AccessToken)).Status);

        HttpClient anonymous = factory.CreateApiClient();
        foreach (string action in new[] { "GetTickets", "GetTicket", "UpdateTicket", "GetTicketSummary" })
        {
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.Post(action, new { id = "BUG-261018-BBBBBB", status = "closed" })).Status);
        }
    }
}
