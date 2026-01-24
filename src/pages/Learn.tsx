import { UnitBanner } from "@/components/UnitBanner";
import { LessonBubble } from "@/components/LessonBubble";
import { useLessonProgress } from "@/hooks/useUserProgress";

const units = [
  {
    id: 1,
    unitId: "unit-1", // Placeholder - should be fetched from database
    title: "Unit 1: Intro to Python",
    description: "Learn the basics of Python programming",
    color: "green" as const,
    lessons: [
      { id: 1, position: "center" as const },
      { id: 2, position: "left" as const },
      { id: 3, position: "right" as const },
      { id: 4, position: "center" as const },
      { id: 5, position: "left" as const },
    ],
  },
  {
    id: 2,
    unitId: "unit-2",
    title: "Unit 2: Variables & Data Types",
    description: "Store and manipulate different types of data",
    color: "blue" as const,
    lessons: [
      { id: 6, position: "center" as const },
      { id: 7, position: "right" as const },
      { id: 8, position: "left" as const },
      { id: 9, position: "center" as const },
      { id: 10, position: "right" as const },
    ],
  },
  {
    id: 3,
    unitId: "unit-3",
    title: "Unit 3: Control Flow",
    description: "Make decisions with if statements and loops",
    color: "orange" as const,
    lessons: [
      { id: 11, position: "center" as const },
      { id: 12, position: "left" as const },
      { id: 13, position: "right" as const },
      { id: 14, position: "center" as const },
    ],
  },
  {
    id: 4,
    unitId: "unit-4",
    title: "Unit 4: Functions",
    description: "Create reusable blocks of code",
    color: "purple" as const,
    lessons: [
      { id: 15, position: "center" as const },
      { id: 16, position: "right" as const },
      { id: 17, position: "left" as const },
    ],
  },
];

export default function Learn() {
  const { data: lessonProgress = [] } = useLessonProgress();
  
  // Get completed lesson IDs
  const completedLessonIds = lessonProgress
    .filter((p) => p.completed)
    .map((p) => p.lesson_id);

  // Determine the status of each lesson based on progress
  const getLessonStatus = (lessonId: number): "complete" | "current" | "locked" => {
    if (completedLessonIds.includes(lessonId)) {
      return "complete";
    }
    // First lesson is always accessible
    if (lessonId === 1) {
      return "current";
    }
    // A lesson is current if the previous one is complete
    if (completedLessonIds.includes(lessonId - 1)) {
      return "current";
    }
    return "locked";
  };

  // Find current lesson for each unit
  const getCurrentLessonForUnit = (unitLessons: { id: number }[]): number | undefined => {
    for (const lesson of unitLessons) {
      const status = getLessonStatus(lesson.id);
      if (status === "current") {
        return lesson.id;
      }
    }
    return undefined;
  };

  // Determine if unit is active
  const isUnitActive = (unitLessons: { id: number }[]): boolean => {
    return unitLessons.some(lesson => getLessonStatus(lesson.id) === "current");
  };

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
            isActive={isUnitActive(unit.lessons)}
            currentLessonId={getCurrentLessonForUnit(unit.lessons)}
            unitId={unit.unitId}
          />

          {/* Lessons */}
          <div className="flex flex-col items-center space-y-6 py-4">
            {unit.lessons.map((lesson, lessonIndex) => (
              <LessonBubble
                key={lesson.id}
                id={lesson.id}
                status={getLessonStatus(lesson.id)}
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
