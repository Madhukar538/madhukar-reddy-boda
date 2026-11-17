using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dhucar.Portfolio.Common.Logging;
using Dhucar.Portfolio.Common.Services;
using Dhucar.Portfolio.DataAccess;
using Dhucar.Portfolio.Properties;
using Dhucar.Portfolio.Properties.Documents;
using Dhucar.Portfolio.Properties.Models;

namespace Dhucar.Portfolio.BusinessLogic.BAL;

/*
 * Author Name     :  Boda Madhukar Reddy
 * Create Date     :  18 Oct 2026
 * Modified Date   :
 * Modified Reason :
 * Layer           :  BusinessLogic
 * Modified By     :
 * Description     :  Support tickets filed on the site: storing them, listing and managing them in the admin, and the dashboard summary.
 */
public partial class TicketBAL(TicketDAL ticketDAL, AuditBAL auditBAL, IContextService contextService, ICodeLogger codeLog)
{
    /// <summary>Ticket statuses, in workflow order.</summary>
    public static readonly string[] Statuses = ["open", "in-progress", "resolved", "closed"];

    /// <summary>Status names as people read them, for the ticket timeline.</summary>
    private static readonly Dictionary<string, string> StatusLabels = new()
    {
        ["open"] = "Open",
        ["in-progress"] = "In progress",
        ["resolved"] = "Resolved",
        ["closed"] = "Closed",
    };

    /// <summary>Status names as the reporter reads them on their status page.</summary>
    public static readonly Dictionary<string, string> ReporterStatusLabels = new()
    {
        ["open"] = "Received",
        ["in-progress"] = "Looking into it",
        ["resolved"] = "Fixed",
        ["closed"] = "Closed",
    };

    /// <summary>Statuses that still need work.</summary>
    public static readonly string[] ActiveStatuses = ["open", "in-progress"];

    /// <summary>Priorities, most urgent first.</summary>
    public static readonly string[] Priorities = ["P1", "P2", "P3", "P4"];

    private const int MaxNoteLength = 2000;

    [GeneratedRegex("^[A-Z]{2,8}-[A-Z0-9-]{4,40}$")]
    private static partial Regex TicketIdPattern();

    [GeneratedRegex("^[A-Za-z0-9_-]{32,128}$")]
    private static partial Regex StatusTokenPattern();

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   CreateTicket
    // Method Description    :   Stores a triaged ticket sent by the site; a repeat of the same id is accepted without a second copy.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>CreateTicket : </c> Stores a triaged ticket sent by the site; a repeat of the same id is accepted without a second copy.
    /// </summary>
    public async Task<Response<object>> CreateTicket(CreateTicketRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string ticketId = (objAPIRequest.Id ?? string.Empty).Trim().ToUpperInvariant();
            string priority = (objAPIRequest.Priority ?? string.Empty).Trim().ToUpperInvariant();
            string error = !TicketIdPattern().IsMatch(ticketId) ? "Invalid ticket id."
                : !Priorities.Contains(priority) ? "Priority must be P1 to P4."
                : Clip(objAPIRequest.Title, 200).Length == 0 ? "Title is required."
                : Clip(objAPIRequest.Description, 8000).Length == 0 ? "Description is required."
                : (objAPIRequest.StatusToken ?? string.Empty).Length > 0 && !StatusTokenPattern().IsMatch(objAPIRequest.StatusToken!) ? "Invalid status token."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            DateTime now = DateTime.UtcNow;
            await ticketDAL.InsertTicketDB(new TicketDocument
            {
                Id = ticketId,
                Name = Clip(objAPIRequest.Name, 120),
                Contact = Clip(objAPIRequest.Contact, 200),
                Category = Clip(objAPIRequest.Category, 60),
                Title = Clip(objAPIRequest.Title, 200),
                Description = Clip(objAPIRequest.Description, 8000),
                Urgency = Clip(objAPIRequest.Urgency, 60),
                Stack = Clip(objAPIRequest.Stack, 300),
                Link = WebLink(Clip(objAPIRequest.Link, 500)),
                Page = Clip(objAPIRequest.Page, 300),
                Priority = priority,
                TriageReasons = (objAPIRequest.TriageReasons ?? []).Select(x => Clip(x, 200)).Where(x => x.Length > 0).Take(10).ToList(),
                Status = "open",
                StatusTokenHash = (objAPIRequest.StatusToken ?? string.Empty).Length > 0 ? HashToken(objAPIRequest.StatusToken!) : string.Empty,
                CreatedAt = now,
                UpdatedAt = now,
            });
            objResponse.Data = new SaveResultDTO { Id = ticketId };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Ticket stored.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step CreateTicket", string.Empty, nameof(CreateTicket));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetTickets
    // Method Description    :   One page of tickets for the admin list, filtered by status, priority and text.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTickets : </c> One page of tickets for the admin list, filtered by status, priority and text.
    /// </summary>
    public async Task<Response<object>> GetTickets(GetTicketsRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string status = (objAPIRequest.Status ?? "active").Trim().ToLowerInvariant();
            string priority = (objAPIRequest.Priority ?? string.Empty).Trim().ToUpperInvariant();
            string[]? statuses = status switch
            {
                "active" => ActiveStatuses,
                "all" => [],
                _ when Statuses.Contains(status) => [status],
                _ => null,
            };
            if (statuses == null || (priority.Length > 0 && !Priorities.Contains(priority)))
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = "Unknown status or priority.";
                return objResponse;
            }
            (int page, int pageSize, int skip) = Paging.Normalize(objAPIRequest);
            (List<TicketDocument> tickets, long total) = await ticketDAL.GetTicketPageDB(statuses, priority, Clip(objAPIRequest.Search, 100), skip, pageSize);
            objResponse.Data = Paging.Result(tickets.Select(ToListItem).ToList(), page, pageSize, total);
            objResponse.RowCount = total;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetTickets", string.Empty, nameof(GetTickets));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetTicket
    // Method Description    :   One ticket with all its details and notes.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTicket : </c> One ticket with all its details and notes.
    /// </summary>
    public async Task<Response<object>> GetTicket(GetItemRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            TicketDocument? ticket = await ticketDAL.GetTicketDB(Clip(objAPIRequest.Id, 60).ToUpperInvariant());
            if (ticket == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Ticket not found.";
                return objResponse;
            }
            objResponse.Data = ticket;
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetTicket", string.Empty, nameof(GetTicket));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   UpdateTicket
    // Method Description    :   Changes a ticket’s status or priority and/or adds a note; each change is recorded on the ticket and in the audit log.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>UpdateTicket : </c> Changes a ticket’s status or priority and/or adds a note; each change is recorded on the ticket and in the audit log.
    /// </summary>
    public async Task<Response<object>> UpdateTicket(UpdateTicketRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string ticketId = Clip(objAPIRequest.Id, 60).ToUpperInvariant();
            string status = Clip(objAPIRequest.Status, 20).ToLowerInvariant();
            string priority = Clip(objAPIRequest.Priority, 2).ToUpperInvariant();
            string note = (objAPIRequest.Note ?? string.Empty).Trim();
            string error = status.Length > 0 && !Statuses.Contains(status) ? "Unknown status."
                : priority.Length > 0 && !Priorities.Contains(priority) ? "Priority must be P1 to P4."
                : note.Length > MaxNoteLength ? $"Notes are limited to {MaxNoteLength:N0} characters."
                : status.Length == 0 && priority.Length == 0 && note.Length == 0 ? "Nothing to change."
                : string.Empty;
            if (error.Length > 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.ValidationFailed;
                objResponse.ReturnMessage = error;
                return objResponse;
            }
            TicketDocument? ticket = await ticketDAL.GetTicketDB(ticketId);
            if (ticket == null)
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Ticket not found.";
                return objResponse;
            }
            DateTime now = DateTime.UtcNow;
            string by = contextService.GetEmail();
            List<TicketNoteItem> notes = new List<TicketNoteItem>();
            List<string> changes = new List<string>();
            if (status.Length > 0 && status != ticket.Status)
            {
                changes.Add($"status {StatusLabels.GetValueOrDefault(ticket.Status, ticket.Status)} → {StatusLabels[status]}");
            }
            else
            {
                status = string.Empty;
            }
            if (priority.Length > 0 && priority != ticket.Priority)
            {
                changes.Add($"priority {ticket.Priority} → {priority}");
            }
            else
            {
                priority = string.Empty;
            }
            if (changes.Count > 0)
            {
                // The reporter sees status changes only (never the priority or who made them).
                string publicText = status.Length > 0 ? $"Status: {ReporterStatusLabels[status]}" : string.Empty;
                notes.Add(new TicketNoteItem { At = now, By = by, Text = "Changed " + string.Join(", ", changes) + ".", PublicText = publicText });
            }
            if (note.Length > 0)
            {
                notes.Add(new TicketNoteItem { At = now, By = by, Text = note, PublicText = objAPIRequest.IsNotePublic ? note : string.Empty });
            }
            if (notes.Count == 0)
            {
                objResponse.ReturnCode = (int)ErrorCode.Success;
                objResponse.ReturnMessage = "No changes.";
                return objResponse;
            }
            DateTime? resolvedAt = ticket.ResolvedAt == null && status is "resolved" or "closed" ? now : null;
            await ticketDAL.UpdateTicketDB(ticketId, status, priority, resolvedAt, notes);
            await auditBAL.Write("ticket.updated", true, contextService.GetUserId(), by, $"{ticketId}: {(changes.Count > 0 ? string.Join(", ", changes) : "note")}");
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Ticket updated.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step UpdateTicket", string.Empty, nameof(UpdateTicket));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetTicketSummary
    // Method Description    :   Counts for the dashboard: by status, active by priority, new this week and month, average resolution time, and the newest active tickets.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   18 Oct 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    18 Oct 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTicketSummary : </c> Counts for the dashboard: by status, active by priority, new this week and month, average resolution time, and the newest active tickets.
    /// </summary>
    public async Task<Response<object>> GetTicketSummary(EmptyRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            DateTime now = DateTime.UtcNow;
            Dictionary<string, long> byStatus = await ticketDAL.CountByFieldDB("Status", []);
            Dictionary<string, long> activeByPriority = await ticketDAL.CountByFieldDB("Priority", ActiveStatuses);
            List<double> hours = await ticketDAL.GetResolutionHoursDB(now.AddDays(-90));
            (List<TicketDocument> recent, _) = await ticketDAL.GetTicketPageDB(ActiveStatuses, string.Empty, string.Empty, 0, 20);
            objResponse.Data = new TicketSummaryDTO
            {
                Total = byStatus.Values.Sum(),
                ByStatus = Statuses.ToDictionary(x => x, x => byStatus.GetValueOrDefault(x)),
                ActiveByPriority = Priorities.ToDictionary(x => x, x => activeByPriority.GetValueOrDefault(x)),
                NewLast7Days = await ticketDAL.CountCreatedSinceDB(now.AddDays(-7)),
                NewLast30Days = await ticketDAL.CountCreatedSinceDB(now.AddDays(-30)),
                AverageResolutionHours = hours.Count > 0 ? Math.Round(hours.Average(), 1) : null,
                Recent = recent.OrderBy(x => x.Priority).ThenByDescending(x => x.CreatedAt).Take(5).Select(ToListItem).ToList(),
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetTicketSummary", string.Empty, nameof(GetTicketSummary));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    //****************************************************************************************************
    // Layer                 :   BusinessLogic
    // Method Name           :   GetTicketStatus
    // Method Description    :   A reporter's view of their own ticket, for the secret in their status link: status, dates and the entries shared with them.
    // Author                :   Boda Madhukar Reddy
    // Creation Date         :   17 Nov 2026
    // Input Parameters      :   objAPIRequest
    // Modified Date         :
    // Modified Reason       :
    // Return Values         :   Response
    //----------------------------------------------------------------------------------------------------
    //  Version    Author                 Date              Remarks
    //----------------------------------------------------------------------------------------------------
    //  1.0        Boda Madhukar Reddy    17 Nov 2026       Creation
    //****************************************************************************************************
    /// <summary>
    /// <c>GetTicketStatus : </c> A reporter's view of their own ticket, for the secret in their status link: status, dates and the entries shared with them.
    /// </summary>
    public async Task<Response<object>> GetTicketStatus(GetTicketStatusRequestDTO objAPIRequest)
    {
        Response<object> objResponse = new Response<object>();
        try
        {
            string ticketId = Clip(objAPIRequest.Id, 60).ToUpperInvariant();
            string token = (objAPIRequest.Token ?? string.Empty).Trim();
            TicketDocument? ticket = TicketIdPattern().IsMatch(ticketId) && StatusTokenPattern().IsMatch(token) ? await ticketDAL.GetTicketDB(ticketId) : null;
            // A wrong secret answers exactly like a missing ticket, so ids cannot be probed.
            if (ticket == null || ticket.StatusTokenHash.Length == 0 || !SameHash(ticket.StatusTokenHash, HashToken(token)))
            {
                objResponse.ReturnCode = (int)ErrorCode.NotFound;
                objResponse.ReturnMessage = "Ticket not found.";
                return objResponse;
            }
            List<TicketStatusEventDTO> timeline = [new TicketStatusEventDTO { At = ticket.CreatedAt, Text = "Status: Received" }];
            timeline.AddRange(ticket.Notes.Where(x => x.PublicText.Length > 0).Select(x => new TicketStatusEventDTO { At = x.At, Text = x.PublicText }));
            objResponse.Data = new TicketStatusDTO
            {
                Id = ticket.Id,
                Title = ticket.Title,
                Category = ticket.Category,
                Priority = ticket.Priority,
                Status = ticket.Status,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt,
                ResolvedAt = ticket.ResolvedAt,
                Timeline = timeline,
            };
            objResponse.ReturnCode = (int)ErrorCode.Success;
            objResponse.ReturnMessage = "Success.";
        }
        catch (Exception ex)
        {
            objResponse.ReturnCode = (int)ErrorCode.TechnicalError;
            objResponse.ReturnMessage = "Technical Error.";
            codeLog.Error(ex, "Step GetTicketStatus", string.Empty, nameof(GetTicketStatus));
        }
        finally
        {
            objResponse.ServerDate = DateTime.UtcNow;
        }
        return objResponse;
    }

    /// <summary>SHA-256 of a status-link secret, as lower-case hex.</summary>
    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    }

    /// <summary>Compares two hashes in constant time.</summary>
    private static bool SameHash(string a, string b)
    {
        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(a), Encoding.ASCII.GetBytes(b));
    }

    private static TicketListItemDTO ToListItem(TicketDocument x)
    {
        return new TicketListItemDTO
        {
            Id = x.Id,
            Title = x.Title,
            Category = x.Category,
            Priority = x.Priority,
            Status = x.Status,
            Name = x.Name,
            NoteCount = x.Notes.Count,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
        };
    }

    /// <summary>Keeps a visitor-supplied link only if it is an http(s) address (never javascript: or data:).</summary>
    private static string WebLink(string value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out Uri? uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp) ? value : string.Empty;
    }

    /// <summary>Trims and caps a text field (empty when missing).</summary>
    private static string Clip(string? value, int max)
    {
        string text = (value ?? string.Empty).Trim();
        return text.Length > max ? text[..max] : text;
    }
}
