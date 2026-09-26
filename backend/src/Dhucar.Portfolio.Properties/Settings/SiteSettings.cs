namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  The Next.js site notified after content changes.
 */
public class SiteSettings
{
    /// <summary>Revalidation endpoint, e.g. https://dhucar.in/api/revalidate; empty disables it.</summary>
    public string RevalidateUrl { get; set; } = string.Empty;

    /// <summary>Shared secret for HMAC-signing revalidation requests (at least 32 characters).</summary>
    public string RevalidateSecret { get; set; } = string.Empty;

    /// <summary>Public site host, used to mark internal referrers.</summary>
    public string Host { get; set; } = "dhucar.in";
}
