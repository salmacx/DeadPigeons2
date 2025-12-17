using api.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyDbContext = efscaffold.MyDbContext;
using api.Models.Requests;
using efscaffold.Entities;
using PasswordHasher = api.Etc.PasswordHasher;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly MyDbContext _dbContext;

    public AdminController(MyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var admins = await _dbContext.Admins.ToListAsync();
        return Ok(admins);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var admin = await _dbContext.Admins.FindAsync(id);
        if (admin == null) return NotFound();
        return Ok(admin);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Admin admin)
    {
        if (admin.AdminId == Guid.Empty)
            admin.AdminId = Guid.NewGuid();

        _dbContext.Admins.Add(admin);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = admin.AdminId }, admin);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Admin updatedAdmin)
    {
        // Token validation
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            return Unauthorized("No token provided");

        var token = authHeader.Substring("Bearer ".Length).Trim();

        var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (string.IsNullOrWhiteSpace(secret)) 
            return StatusCode(500, "JWT_SECRET missing");

        var adminId = JwtValidator.ValidateToken(token, secret);
        if (adminId == null) 
            return Unauthorized("Invalid token");

        var admin = await _dbContext.Admins.FindAsync(id);
        if (admin == null) return NotFound();

        admin.FirstName = updatedAdmin.FirstName;
        admin.LastName = updatedAdmin.LastName;
        admin.Email = updatedAdmin.Email;
        admin.PasswordHash = updatedAdmin.PasswordHash;

        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // Token validation
        var token = Request.Headers["X-Auth-Token"].FirstOrDefault();
        if (token == null) return Unauthorized("No token");
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (string.IsNullOrWhiteSpace(secret)) return StatusCode(500, "JWT_SECRET missing");
        var adminId = JwtValidator.ValidateToken(token, secret);
        if (adminId == null) return Unauthorized("Invalid token");

        var admin = await _dbContext.Admins.FindAsync(id);
        if (admin == null) return NotFound();

        _dbContext.Admins.Remove(admin);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("create-player")]
    public async Task<IActionResult> CreatePlayer([FromBody] RegisterPlayerRequestDto dto)
    {
        // Token validation
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            return Unauthorized("No token provided");

        var token = authHeader.Substring("Bearer ".Length).Trim();

        var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (string.IsNullOrWhiteSpace(secret)) return StatusCode(500, "JWT_SECRET missing");
        var adminId = JwtValidator.ValidateToken(token, secret);
        if (adminId == null) return Unauthorized("Invalid token");

        // Check email
        if (await _dbContext.Players.AnyAsync(p => p.Email == dto.Email))
            return BadRequest("Email already in use");

        var player = new Player
        {
            PlayerId = Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            PasswordHash = PasswordHasher.Hash(dto.Password),
            IsActive = true
        };

        _dbContext.Players.Add(player);
        await _dbContext.SaveChangesAsync();

        return Ok(new { player.PlayerId, player.Email });
    }
}
