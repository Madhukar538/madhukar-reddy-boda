namespace Dhucar.Portfolio.Properties;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  Properties
 * Modified By     :
 * Description     :  Return codes used in Response.ReturnCode; controllers map them to HTTP status codes.
 */
public enum ErrorCode
{
    Success = 1,
    ValidationFailed = -1,
    Unauthorized = -2,
    Forbidden = -3,
    LockedOut = -4,
    NotFound = -5,
    Conflict = -6,
    TechnicalError = -99,
}
