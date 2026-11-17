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

    [Fact]
    public async Task Reporters_see_their_ticket_only_with_the_secret_and_only_what_is_shared()
    {
        using ApiFactory factory = new();
        HttpClient site = factory.CreateApiClient();
        const string secret = "k3Y_for-THE-status-link-0123456789abcdef";
        object withLink = new { id = "BUG-261117-LINK01", name = "Asha", contact = "asha@example.com", category = "Bug", title = "Login loops", description = "Redirects forever.", urgency = "This week", priority = "P2", statusToken = secret };
        Assert.Equal(HttpStatusCode.OK, (await CreateSigned(site, withLink)).Status);
        // A malformed secret is refused rather than stored.
        object badSecret = new { id = "BUG-261117-LINK02", name = "A", contact = "a@example.com", category = "Bug", title = "T", description = "D", urgency = "Low", priority = "P4", statusToken = "short<script>" };
        Assert.Equal(HttpStatusCode.BadRequest, (await CreateSigned(site, badSecret)).Status);
        // Filed without a secret (before links existed): no status page at all.
        await CreateSigned(site, Ticket("BUG-261117-NOLINK"));

        AdminSession session = await AdminSession.SignedIn(factory);
        await session.Client.Post("UpdateTicket", new { id = "BUG-261117-LINK01", status = "in-progress", priority = "P1", note = "Internal: their session cookie is SameSite=None." }, token: session.AccessToken);
        await session.Client.Post("UpdateTicket", new { id = "BUG-261117-LINK01", note = "Found it: a redirect loop in the auth middleware.", isNotePublic = true }, token: session.AccessToken);

        HttpClient anonymous = factory.CreateApiClient();
        ApiResult status = await anonymous.Post("GetTicketStatus", new { id = "bug-261117-link01", token = secret });
        Assert.Equal(HttpStatusCode.OK, status.Status);
        Assert.Equal("in-progress", status.Data.GetProperty("status").GetString());
        string[] timeline = status.Data.GetProperty("timeline").EnumerateArray().Select(x => x.GetProperty("text").GetString()!).ToArray();
        Assert.Equal(["Status: Received", "Status: Looking into it", "Found it: a redirect loop in the auth middleware."], timeline);
        // Nothing private comes back: no contact, description, private notes or admin names.
        string body = status.Body.GetRawText();
        foreach (string hidden in new[] { "asha@example.com", "Redirects forever", "SameSite", "Internal", "contact", "description", "statusTokenHash", "\"by\"" })
        {
            Assert.DoesNotContain(hidden, body);
        }

        // Wrong secret, missing secret, unknown id and a ticket without a link all answer the same.
        foreach (object probe in new object[]
        {
            new { id = "BUG-261117-LINK01", token = secret.Replace('k', 'K') },
            new { id = "BUG-261117-LINK01", token = string.Empty },
            new { id = "BUG-000000-NOPE00", token = secret },
            new { id = "BUG-261117-NOLINK", token = secret },
        })
        {
            ApiResult refused = await anonymous.Post("GetTicketStatus", probe);
            Assert.Equal(HttpStatusCode.NotFound, refused.Status);
            Assert.Equal("Ticket not found.", refused.Body.GetProperty("returnMessage").GetString());
        }
    }
}
