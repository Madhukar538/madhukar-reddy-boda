namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Traffic tracking settings.
 */
public class TrackingSettings
{
    /// <summary>Days page views are kept before MongoDB deletes them.</summary>
    public int RetentionDays { get; set; } = 395;
}
