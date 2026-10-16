using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Enjazi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ClerkUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "clerk_user_id",
                table: "users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "ix_users_clerk_user_id",
                table: "users",
                column: "clerk_user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_clerk_user_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "clerk_user_id",
                table: "users");
        }
    }
}
