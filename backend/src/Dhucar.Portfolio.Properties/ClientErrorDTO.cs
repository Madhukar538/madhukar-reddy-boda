namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Nov 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  One kind of browser error for the admin: what it says, where, and how often.
 */
public class ClientErrorDTO
{
    /// <summary>Group id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>The error message.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>The script it came from (path only), or empty.</summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>Line in the script, or 0.</summary>
    public int Line { get; set; }

    /// <summary>Column in the script, or 0.</summary>
    public int Column { get; set; }

    /// <summary>The first few lines of the stack.</summary>
    public string Stack { get; set; } = string.Empty;

    /// <summary>The page it last happened on.</summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>The site look it last happened in.</summary>
    public string Look { get; set; } = string.Empty;

    /// <summary>The browser family it last happened in.</summary>
    public string Browser { get; set; } = string.Empty;

    /// <summary>How many times it has been reported.</summary>
    public long Count { get; set; }

    /// <summary>UTC time it was first reported.</summary>
    public DateTime FirstSeen { get; set; }

    /// <summary>UTC time it was last reported.</summary>
    public DateTime LastSeen { get; set; }
}
