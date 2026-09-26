using System.Net;

namespace Dhucar.Portfolio.Tests.Infrastructure;

/// <summary>Stands in for the Next.js site: records revalidation requests and answers 200.</summary>
public sealed class RecordingHandler : HttpMessageHandler
{
    public List<(Uri Url, Dictionary<string, string> Headers, string Body)> Requests { get; } = new();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        string body = request.Content == null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
        lock (Requests)
        {
            Requests.Add((request.RequestUri!, request.Headers.ToDictionary(h => h.Key, h => string.Join(",", h.Value)), body));
        }
        return new HttpResponseMessage(HttpStatusCode.OK);
    }
}
