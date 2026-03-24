"""add google OAuth token columns to users

Revision ID: 20260323_add_google_tokens_to_users
Revises: fd5999e60116
Create Date: 2026-03-23 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_google_tokens'
down_revision: Union[str, Sequence[str], None] = 'fd5999e60116'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_access_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('google_refresh_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('google_token_expiry', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'google_token_expiry')
    op.drop_column('users', 'google_refresh_token')
    op.drop_column('users', 'google_access_token')
