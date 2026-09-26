namespace Dhucar.Portfolio.Properties.Models;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  First sign-in step: email and password.
 */
public class LoginRequestDTO
{
    /// <summary>Admin email.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Password.</summary>
    public string Password { get; set; } = string.Empty;
}
