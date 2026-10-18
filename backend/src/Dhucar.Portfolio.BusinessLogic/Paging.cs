using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Clamps paging input and builds the paged result, so every admin list pages the same way.
 */
public static class Paging
{
    /// <summary>Largest page an admin list will return.</summary>
    public const int MaxPageSize = 100;

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Normalize
    // Method Description    :   Clamps page and page size and returns the number of items to skip.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   (page, pageSize, skip)
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Normalize : </c> Clamps page and page size and returns the number of items to skip.
    /// </summary>
    public static (int Page, int PageSize, int Skip) Normalize(PageRequestDTO objAPIRequest)
    {
        int pageSize = Math.Clamp(objAPIRequest.PageSize, 1, MaxPageSize);
        int page = Math.Clamp(objAPIRequest.Page, 1, 100_000);
        return (page, pageSize, (page - 1) * pageSize);
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   Result
    // Method Description    :   Wraps one page of items with its totals.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   items, page, pageSize, totalCount
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   PagedResultDTO
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>Result : </c> Wraps one page of items with its totals.
    /// </summary>
    public static PagedResultDTO<T> Result<T>(List<T> items, int page, int pageSize, long totalCount)
    {
        return new PagedResultDTO<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Max(1, (totalCount + pageSize - 1) / pageSize),
        };
    }
}
