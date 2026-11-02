import getpass
import sys

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import hash_password
from app.db.session import DatabaseConfigurationError, get_session_factory
from app.models.admin import Admin

EMAIL_ADAPTER = TypeAdapter(EmailStr)


def create_admin() -> int:
    try:
        email = str(EMAIL_ADAPTER.validate_python(input("Admin email: ").strip())).lower()
    except ValidationError:
        print("Enter a valid email address.", file=sys.stderr)
        return 1
    password = getpass.getpass("Admin password (12+ characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if len(password) < 12 or len(password) > 128:
        print("Password must contain between 12 and 128 characters.", file=sys.stderr)
        return 1
    if password != confirmation:
        print("Passwords do not match.", file=sys.stderr)
        return 1
    try:
        with get_session_factory()() as session:
            if session.scalar(select(Admin.id).where(Admin.email == email)) is not None:
                print("An admin with that email already exists.", file=sys.stderr)
                return 1
            session.add(Admin(email=email, password_hash=hash_password(password)))
            session.commit()
    except DatabaseConfigurationError:
        print("DATABASE_URL is not configured.", file=sys.stderr)
        return 1
    except SQLAlchemyError:
        print("Unable to create the admin account using the configured database.", file=sys.stderr)
        return 1
    print("Admin account created.")
    return 0


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != "create-admin":
        print("Usage: python -m app.cli create-admin", file=sys.stderr)
        return 2
    return create_admin()


if __name__ == "__main__":
    raise SystemExit(main())
