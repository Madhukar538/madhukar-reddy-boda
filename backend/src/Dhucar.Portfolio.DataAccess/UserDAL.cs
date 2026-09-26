using Dhucar.Portfolio.Properties.Documents;
using MongoDB.Driver;

namespace Dhucar.Portfolio.DataAccess;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  26 Sep 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  DataAccess
 * Modified By     :
 * Description     :  Admin user reads and atomic security updates.
 */
public class UserDAL(MongoContext context)
{
    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   CountUsersDB
    // Method Description    :   Counts admin accounts.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   none
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   long
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CountUsersDB : </c> Counts admin accounts.
    /// </summary>
    public async Task<long> CountUsersDB()
    {
        return await context.Users.CountDocumentsAsync(FilterDefinition<AdminUserDocument>.Empty);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetUserByEmailDB
    // Method Description    :   Finds a user by lower-cased email.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   email
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AdminUserDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserByEmailDB : </c> Finds a user by lower-cased email.
    /// </summary>
    public async Task<AdminUserDocument?> GetUserByEmailDB(string email)
    {
        return await context.Users.Find(x => x.Email == email).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   GetUserByIdDB
    // Method Description    :   Finds a user by id.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   AdminUserDocument or null
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetUserByIdDB : </c> Finds a user by id.
    /// </summary>
    public async Task<AdminUserDocument?> GetUserByIdDB(string userId)
    {
        return await context.Users.Find(x => x.Id == userId).FirstOrDefaultAsync();
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   InsertUserDB
    // Method Description    :   Inserts a user; fails on a duplicate email (unique index).
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   user
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>InsertUserDB : </c> Inserts a user; fails on a duplicate email (unique index).
    /// </summary>
    public async Task InsertUserDB(AdminUserDocument user)
    {
        await context.Users.InsertOneAsync(user);
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ConfirmTotpDB
    // Method Description    :   Marks TOTP as confirmed, records the used step and stores recovery-code hashes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, step, recoveryCodeHashes
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ConfirmTotpDB : </c> Marks TOTP as confirmed, records the used step and stores recovery-code hashes.
    /// </summary>
    public async Task<bool> ConfirmTotpDB(string userId, long step, List<string> recoveryCodeHashes)
    {
        UpdateResult result = await context.Users.UpdateOneAsync(
            x => x.Id == userId && !x.IsTotpConfirmed,
            Builders<AdminUserDocument>.Update
                .Set(x => x.IsTotpConfirmed, true)
                .Set(x => x.LastTotpStep, step)
                .Set(x => x.RecoveryCodeHashes, recoveryCodeHashes));
        return result.ModifiedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   RecordFailureDB
    // Method Description    :   Atomically counts a failed attempt and locks the account at the threshold.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, maxAttempts, lockoutMinutes
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RecordFailureDB : </c> Atomically counts a failed attempt and locks the account at the threshold.
    /// </summary>
    public async Task RecordFailureDB(string userId, int maxAttempts, int lockoutMinutes)
    {
        AdminUserDocument? updated = await context.Users.FindOneAndUpdateAsync(
            x => x.Id == userId,
            Builders<AdminUserDocument>.Update.Inc(x => x.FailedAttempts, 1),
            new FindOneAndUpdateOptions<AdminUserDocument> { ReturnDocument = ReturnDocument.After });
        if (updated != null && updated.FailedAttempts >= maxAttempts)
        {
            await context.Users.UpdateOneAsync(x => x.Id == userId, Builders<AdminUserDocument>.Update
                .Set(x => x.LockoutUntil, DateTime.UtcNow.AddMinutes(lockoutMinutes))
                .Set(x => x.FailedAttempts, 0));
        }
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   RecordSuccessDB
    // Method Description    :   Clears failures and lockout and stamps the last sign-in.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>RecordSuccessDB : </c> Clears failures and lockout and stamps the last sign-in.
    /// </summary>
    public async Task RecordSuccessDB(string userId)
    {
        await context.Users.UpdateOneAsync(x => x.Id == userId, Builders<AdminUserDocument>.Update
            .Set(x => x.FailedAttempts, 0)
            .Set(x => x.LockoutUntil, null)
            .Set(x => x.LastLoginAt, DateTime.UtcNow));
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ClaimTotpStepDB
    // Method Description    :   Records a used TOTP step only if it is newer than the last one, so a code can't be replayed even by concurrent requests.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, step
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ClaimTotpStepDB : </c> Records a used TOTP step only if it is newer than the last one, so a code can't be replayed even by concurrent requests.
    /// </summary>
    public async Task<bool> ClaimTotpStepDB(string userId, long step)
    {
        UpdateResult result = await context.Users.UpdateOneAsync(
            x => x.Id == userId && x.LastTotpStep < step,
            Builders<AdminUserDocument>.Update.Set(x => x.LastTotpStep, step));
        return result.ModifiedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   ConsumeRecoveryCodeDB
    // Method Description    :   Removes a recovery-code hash; true only for the request that removed it.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, codeHash
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   bool
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>ConsumeRecoveryCodeDB : </c> Removes a recovery-code hash; true only for the request that removed it.
    /// </summary>
    public async Task<bool> ConsumeRecoveryCodeDB(string userId, string codeHash)
    {
        UpdateResult result = await context.Users.UpdateOneAsync(
            x => x.Id == userId && x.RecoveryCodeHashes.Contains(codeHash),
            Builders<AdminUserDocument>.Update.Pull(x => x.RecoveryCodeHashes, codeHash));
        return result.ModifiedCount == 1;
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   SetRecoveryCodesDB
    // Method Description    :   Replaces all recovery-code hashes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, codeHashes
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetRecoveryCodesDB : </c> Replaces all recovery-code hashes.
    /// </summary>
    public async Task SetRecoveryCodesDB(string userId, List<string> codeHashes)
    {
        await context.Users.UpdateOneAsync(x => x.Id == userId, Builders<AdminUserDocument>.Update.Set(x => x.RecoveryCodeHashes, codeHashes));
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   SetSecurityStampDB
    // Method Description    :   Sets a new security stamp, invalidating every issued access token.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId, stamp
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>SetSecurityStampDB : </c> Sets a new security stamp, invalidating every issued access token.
    /// </summary>
    public async Task SetSecurityStampDB(string userId, string stamp)
    {
        await context.Users.UpdateOneAsync(x => x.Id == userId, Builders<AdminUserDocument>.Update.Set(x => x.SecurityStamp, stamp));
    }

    //****************************************************************************************************
    // Layer                 :   DataAccess
    // Method Name           :   DeleteUnconfirmedUserDB
    // Method Description    :   Deletes a user whose TOTP enrolment was never confirmed.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   26 Sep 2026
    // Input Parameters      :   userId
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Task
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    26 Sep 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>DeleteUnconfirmedUserDB : </c> Deletes a user whose TOTP enrolment was never confirmed.
    /// </summary>
    public async Task DeleteUnconfirmedUserDB(string userId)
    {
        await context.Users.DeleteOneAsync(x => x.Id == userId && !x.IsTotpConfirmed);
    }
}
