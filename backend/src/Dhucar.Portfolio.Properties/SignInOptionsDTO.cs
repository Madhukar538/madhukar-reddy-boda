namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Which sign-in methods the sign-in page should offer.
 */
public class SignInOptionsDTO
{
    /// <summary>False: passkey only, so the page hides the email and password form.</summary>
    public bool IsPasswordLoginEnabled { get; set; }

    /// <summary>True only while first-time setup can run (a setup token is configured and no admin exists yet); the page hides its setup link otherwise.</summary>
    public bool IsSetupAvailable { get; set; }
}
