namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  MongoDB connection settings.
 */
public class MongoSettings
{
    /// <summary>Connection string (use a user with readWrite on one database only).</summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>Database name.</summary>
    public string Database { get; set; } = "portfolio";
}
