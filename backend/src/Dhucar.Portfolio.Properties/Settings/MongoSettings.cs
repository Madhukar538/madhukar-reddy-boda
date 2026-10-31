namespace Dhucar.Portfolio.Properties.Settings;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :  31 Oct 2026
 * Modified Reason :  Username and password apart from the connection string
 * Layer           :  Properties
 * Modified By     :  Boda Madhukar Reddy
 * Description     :  MongoDB connection settings.
 */
public class MongoSettings
{
    /// <summary>Connection string (use a user with readWrite on one database only).</summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>Database name.</summary>
    public string Database { get; set; } = "portfolio";

    /// <summary>Optional: the user, signing in to <see cref="Database"/>. Kept out of the connection string so any password works as is.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Optional: that user's password.</summary>
    public string Password { get; set; } = string.Empty;
}
