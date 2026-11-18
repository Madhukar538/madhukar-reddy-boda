using MongoDB.Bson.Serialization.Attributes;

namespace Dhucar.Portfolio.Properties.Documents;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One kind of script error seen in visitors' browsers, counted each time it happens again.
 *                    No IP address, cookie, user id or full user agent is stored.
 */
[BsonIgnoreExtraElements]
public class ClientErrorDocument
{
    /// <summary>Group id: a hash of the message and where in the code it was thrown.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    /// <summary>The error message, with emails and long numbers masked.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>The script it came from (path only), or empty.</summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>Line in the script, or 0.</summary>
    public int Line { get; set; }

    /// <summary>Column in the script, or 0.</summary>
    public int Column { get; set; }

    /// <summary>The first few lines of the stack, from the first time it was seen.</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>The page it last happened on, without query string.</summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>The site look it last happened in, or empty.</summary>
    public string Look { get; set; } = string.Empty;

    /// <summary>The browser family it last happened in (Chrome, Firefox, Safari, Edge or Other).</summary>
    public string Browser { get; set; } = string.Empty;

    /// <summary>How many times it has been reported.</summary>
    public long Count { get; set; }

    /// <summary>UTC time it was first reported.</summary>
    public DateTime FirstSeen { get; set; }

    /// <summary>UTC time it was last reported; a TTL index drops groups not seen for 90 days.</summary>
    public DateTime LastSeen { get; set; }
}
