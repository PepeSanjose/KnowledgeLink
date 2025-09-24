"""add team_managers table

Revision ID: 0001_add_team_managers
Revises: 
Create Date: 2025-09-24 11:18:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_add_team_managers"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "team_managers",
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("team_id", "user_id"),
        sa.UniqueConstraint("team_id", "user_id", name="uq_team_manager"),
    )


def downgrade() -> None:
    op.drop_table("team_managers")
