from enum import StrEnum


class ContactStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class AdmissionStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class CourseType(StrEnum):
    COURSE = "course"
    INTERNSHIP = "internship"
    PROGRAMME = "programme"


class CourseTheme(StrEnum):
    SKY = "sky"
    MINT = "mint"
    AMBER = "amber"
    VIOLET = "violet"


class CourseLevel(StrEnum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class CourseCertificate(StrEnum):
    COURSE_COMPLETION = "Course completion — Way2Skills"
    INTERNSHIP_COMPLETION = "Internship completion — Durozen Technologies"
    PROJECT_COMPLETION = "Project completion — Durozen Technologies"
