import { UnitBanner } from "@/components/UnitBanner";
import { LessonBubble } from "@/components/LessonBubble";

const units = [
  {
    id: 1,
    title: "Unit 1: Intro to Python",
    description: "Learn the basics of Python programming",
    color: "green" as const,
    isActive: true,
    lessons: [
      { id: 1, status: "complete" as const, position: "center" as const },
      { id: 2, status: "complete" as const, position: "left" as const },
      { id: 3, status: "complete" as const, position: "right" as const },
      { id: 4, status: "current" as const, position: "center" as const },
      { id: 5, status: "locked" as const, position: "left" as const },
    ],
  },
  {
    id: 2,
    title: "Unit 2: Variables & Data Types",
    description: "Store and manipulate different types of data",
    color: "blue" as const,
    isActive: false,
    lessons: [
      { id: 6, status: "locked" as const, position: "center" as const },
      { id: 7, status: "locked" as const, position: "right" as const },
      { id: 8, status: "locked" as const, position: "left" as const },
      { id: 9, status: "locked" as const, position: "center" as const },
      { id: 10, status: "locked" as const, position: "right" as const },
    ],
  },
  {
    id: 3,
    title: "Unit 3: Control Flow",
    description: "Make decisions with if statements and loops",
    color: "orange" as const,
    isActive: false,
    lessons: [
      { id: 11, status: "locked" as const, position: "center" as const },
      { id: 12, status: "locked" as const, position: "left" as const },
      { id: 13, status: "locked" as const, position: "right" as const },
      { id: 14, status: "locked" as const, position: "center" as const },
    ],
  },
  {
    id: 4,
    title: "Unit 4: Functions",
    description: "Create reusable blocks of code",
    color: "purple" as const,
    isActive: false,
    lessons: [
      { id: 15, status: "locked" as const, position: "center" as const },
      { id: 16, status: "locked" as const, position: "right" as const },
      { id: 17, status: "locked" as const, position: "left" as const },
    ],
  },
];

export default function Learn() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">
          Learn Python 🐍
        </h1>
        <p className="text-muted-foreground">
          Master the world's most popular programming language
        </p>
      </div>

      {/* Units */}
      {units.map((unit, unitIndex) => (
        <div key={unit.id} className="space-y-8">
          <UnitBanner 
            title={unit.title}
            description={unit.description}
            color={unit.color}
            isActive={unit.isActive}
          />

          {/* Lessons */}
          <div className="flex flex-col items-center space-y-6 py-4">
            {unit.lessons.map((lesson, lessonIndex) => (
              <LessonBubble
                key={lesson.id}
                id={lesson.id}
                status={lesson.status}
                position={lesson.position}
                lessonNumber={lessonIndex + 1}
              />
            ))}
          </div>

          {/* Connector line (except for last unit) */}
          {unitIndex < units.length - 1 && (
            <div className="flex justify-center">
              <div className="w-1 h-8 bg-border rounded-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
