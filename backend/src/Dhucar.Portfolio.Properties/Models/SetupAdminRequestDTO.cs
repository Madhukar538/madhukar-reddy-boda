namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Creates the one and only admin account (needs the server setup token).
 */
public class SetupAdminRequestDTO
{
    /// <summary>One-time setup token from the server environment.</summary>
    public string SetupToken { get; set; } = string.Empty;

    /// <summary>Admin email.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Password, 12 to 128 characters.</summary>
    public string Password { get; set; } = string.Empty;
}
