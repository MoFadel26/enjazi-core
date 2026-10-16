using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Enjazi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class GuestUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "clerk_user_id",
                table: "users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "expires_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_guest",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_users_expires_at",
                table: "users",
                column: "expires_at",
                filter: "is_guest");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_guest",
                table: "users");

            migrationBuilder.AlterColumn<string>(
                name: "clerk_user_id",
                table: "users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);
        }
    }
}
