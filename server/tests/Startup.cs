using api;
using api.Etc;
using efscaffold;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Time.Testing;
using Testcontainers.PostgreSql;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace tests;

public class Startup
{
    public static void ConfigureServices(IServiceCollection services)
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        Program.ConfigureServices(services, configuration);
        services.RemoveAll(typeof(MyDbContext));
        services.AddScoped<MyDbContext>(factory =>
        {
            var postgreSqlContainer = new PostgreSqlBuilder().Build();
            postgreSqlContainer.StartAsync().GetAwaiter().GetResult();
            var connectionString = postgreSqlContainer.GetConnectionString();
            var options = new DbContextOptionsBuilder<MyDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            var ctx = new MyDbContext(options);
            ctx.Database.EnsureCreated();
            return ctx;
        });
        services.RemoveAll<TimeProvider>();
        var fakeTime = new FakeTimeProvider();
        services.AddSingleton<TimeProvider>(fakeTime);
        services.AddScoped<ISeeder, Seeder>();
    }
}