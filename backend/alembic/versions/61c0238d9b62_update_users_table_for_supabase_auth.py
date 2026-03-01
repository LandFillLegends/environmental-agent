"""update users table for supabase auth

Revision ID: 61c0238d9b62
Revises: 03d5ef70596b
Create Date: 2026-02-28 16:16:11.595830

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61c0238d9b62'
down_revision: Union[str, Sequence[str], None] = '03d5ef70596b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid')
    op.alter_column('users', 'username',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.drop_index('ix_users_id', table_name='users')
    op.drop_column('users', 'hashed_password')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('hashed_password', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.alter_column('users', 'username',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('users', 'id',
               existing_type=sa.UUID(),
               type_=sa.INTEGER(),
               existing_nullable=False)
    # ### end Alembic commands ###