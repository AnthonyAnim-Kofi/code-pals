import { useState, useCallback, useEffect } from "react";
import { UnitBanner } from "@/components/UnitBanner";
import { LessonBubble } from "@/components/LessonBubble";
import { useLessonProgress } from "@/hooks/useUserProgress";
import { useLanguages, useUnitsForLanguage, useLessonsForUnit } from "@/hooks/useLanguages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";

const positionPattern: ("center" | "left" | "right")[] = ["center", "left", "right", "center", "right", "left"];

export default function Learn() {
  const { data: languages = [], isLoading: languagesLoading } = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  // Auto-select first language
  const activeLanguage = selectedLanguage || languages[0]?.id || null;
  const currentLanguage = languages.find(l => l.id === activeLanguage);
  
  const { data: units = [], isLoading: unitsLoading } = useUnitsForLanguage(activeLanguage);
  const { data: lessonProgress = [] } = useLessonProgress();
  
  // Get completed lesson IDs (now using string UUIDs from database)
  const completedLessonIds = lessonProgress
    .filter((p) => p.completed)
    .map((p) => String(p.lesson_id));

  // For the new database structure, we need to track lesson order globally
  const getAllLessonsInOrder = () => {
    const allLessons: { id: string; unitId: string; orderIndex: number }[] = [];
    // This will be populated when we fetch lessons per unit
    return allLessons;
  };

  // Determine the status of each lesson based on progress
  const getLessonStatus = (lessonId: string, lessonIndex: number, unitIndex: number, allPreviousComplete: boolean): "complete" | "current" | "locked" => {
    if (completedLessonIds.includes(lessonId)) {
      return "complete";
    }
    // First lesson of first unit is always accessible
    if (unitIndex === 0 && lessonIndex === 0) {
      return "current";
    }
    // A lesson is current if all previous lessons are complete
    if (allPreviousComplete) {
      return "current";
    }
    return "locked";
  };

  // Fallback units for when database is empty (backward compatibility)
  const fallbackUnits = [
    {
      id: "fallback-1",
      title: "Unit 1: Intro to Python",
      description: "Learn the basics of Python programming",
      color: "green" as const,
      lessons: [
        { id: "1", position: "center" as const },
        { id: "2", position: "left" as const },
        { id: "3", position: "right" as const },
        { id: "4", position: "center" as const },
        { id: "5", position: "left" as const },
      ],
    },
    {
      id: "fallback-2",
      title: "Unit 2: Variables & Data Types",
      description: "Store and manipulate different types of data",
      color: "blue" as const,
      lessons: [
        { id: "6", position: "center" as const },
        { id: "7", position: "right" as const },
        { id: "8", position: "left" as const },
        { id: "9", position: "center" as const },
        { id: "10", position: "right" as const },
      ],
    },
    {
      id: "fallback-3",
      title: "Unit 3: Control Flow",
      description: "Make decisions with if statements and loops",
      color: "orange" as const,
      lessons: [
        { id: "11", position: "center" as const },
        { id: "12", position: "left" as const },
        { id: "13", position: "right" as const },
        { id: "14", position: "center" as const },
      ],
    },
    {
      id: "fallback-4",
      title: "Unit 4: Functions",
      description: "Create reusable blocks of code",
      color: "purple" as const,
      lessons: [
        { id: "15", position: "center" as const },
        { id: "16", position: "right" as const },
        { id: "17", position: "left" as const },
      ],
    },
  ];

  const displayUnits = units.length > 0 ? units : (activeLanguage ? [] : fallbackUnits);
  const useFallback = units.length === 0 && !activeLanguage;

  // Track completed lessons globally across units for proper unlocking
  let globalLessonIndex = 0;
  let allPreviousComplete = true;

  if (languagesLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            Learn {currentLanguage?.name || "Python"} {currentLanguage?.icon || "🐍"}
          </h1>
          <p className="text-muted-foreground">
            {currentLanguage?.description || "Master the world's most popular programming language"}
          </p>
        </div>
        
        {languages.length > 1 && (
          <Select value={activeLanguage || undefined} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  <span className="flex items-center gap-2">
                    <span>{lang.icon}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {unitsLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : displayUnits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No units available yet</p>
          <p className="text-sm mt-2">Check back soon for new content!</p>
        </div>
      ) : useFallback ? (
        // Render fallback units (backward compatibility)
        <>
          {fallbackUnits.map((unit, unitIndex) => {
            const isUnitActive = unit.lessons.some((lesson, idx) => {
              const status = getLessonStatusFallback(lesson.id, idx, unitIndex);
              return status === "current";
            });
            
            const currentLessonId = unit.lessons.find((lesson, idx) => {
              return getLessonStatusFallback(lesson.id, idx, unitIndex) === "current";
            })?.id;

            return (
              <div key={unit.id} className="space-y-8">
                <UnitBanner 
                  title={unit.title}
                  description={unit.description}
                  color={unit.color}
                  isActive={isUnitActive}
                  currentLessonId={currentLessonId ? Number(currentLessonId) : undefined}
                  unitId={unit.id}
                />

                <div className="flex flex-col items-center space-y-6 py-4">
                  {unit.lessons.map((lesson, lessonIndex) => (
                    <LessonBubble
                      key={lesson.id}
                      id={Number(lesson.id)}
                      status={getLessonStatusFallback(lesson.id, lessonIndex, unitIndex)}
                      position={lesson.position}
                      lessonNumber={lessonIndex + 1}
                    />
                  ))}
                </div>

                {unitIndex < fallbackUnits.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-1 h-8 bg-border rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        // Render database units
        <DatabaseUnits 
          units={displayUnits} 
          completedLessonIds={completedLessonIds}
        />
      )}
    </div>
  );

  function getLessonStatusFallback(lessonId: string, lessonIndex: number, unitIndex: number): "complete" | "current" | "locked" {
    const numericId = Number(lessonId);
    if (completedLessonIds.includes(lessonId)) {
      return "complete";
    }
    if (numericId === 1) {
      return "current";
    }
    if (completedLessonIds.includes(String(numericId - 1))) {
      return "current";
    }
    return "locked";
  }
}

// Component to render units from database with lessons
function DatabaseUnits({ 
  units, 
  completedLessonIds 
}: { 
  units: any[]; 
  completedLessonIds: string[];
}) {
  // Track all lessons data for unit locking
  const [allLessonsData, setAllLessonsData] = useState<Map<string, string[]>>(new Map());

  const updateLessonsData = useCallback((unitId: string, lessonIds: string[]) => {
    setAllLessonsData(prev => {
      const next = new Map(prev);
      next.set(unitId, lessonIds);
      return next;
    });
  }, []);

  // Calculate completed lessons per unit
  const getCompletedLessonsForUnit = (unitId: string) => {
    const unitLessons = allLessonsData.get(unitId) || [];
    return unitLessons.filter(id => completedLessonIds.includes(id)).length;
  };

  return (
    <>
      {units.map((unit, unitIndex) => (
        <DatabaseUnit 
          key={unit.id}
          unit={unit}
          unitIndex={unitIndex}
          totalUnits={units.length}
          completedLessonIds={completedLessonIds}
          previousUnitsComplete={checkPreviousUnitsComplete(units, unitIndex, completedLessonIds, allLessonsData)}
          onLessonsLoaded={updateLessonsData}
          completedLessonsCount={getCompletedLessonsForUnit(unit.id)}
        />
      ))}
    </>
  );
}

// This will be computed at render time when we have all lesson data
function checkPreviousUnitsComplete(units: any[], currentUnitIndex: number, completedLessonIds: string[], allLessonsData: Map<string, string[]>): boolean {
  // For first unit, always return true
  if (currentUnitIndex === 0) return true;
  
  // Check all previous units
  for (let i = 0; i < currentUnitIndex; i++) {
    const unitId = units[i].id;
    const unitLessons = allLessonsData.get(unitId) || [];
    
    // If any lesson in this unit is not complete, return false
    for (const lessonId of unitLessons) {
      if (!completedLessonIds.includes(lessonId)) {
        return false;
      }
    }
  }
  
  return true;
}

function DatabaseUnit({ 
  unit, 
  unitIndex, 
  totalUnits,
  completedLessonIds,
  previousUnitsComplete,
  onLessonsLoaded,
  completedLessonsCount
}: { 
  unit: any; 
  unitIndex: number;
  totalUnits: number;
  completedLessonIds: string[];
  previousUnitsComplete: boolean;
  onLessonsLoaded: (unitId: string, lessonIds: string[]) => void;
  completedLessonsCount: number;
}) {
  const { data: lessons = [], isLoading } = useLessonsForUnit(unit.id);
  const positionPattern: ("center" | "left" | "right")[] = ["center", "left", "right", "center", "right", "left"];
  
  // Report lessons to parent for unit locking
  useEffect(() => {
    if (lessons.length > 0) {
      onLessonsLoaded(unit.id, lessons.map(l => l.id));
    }
  }, [lessons, unit.id, onLessonsLoaded]);

  // Check if this entire unit is locked (previous unit not complete)
  const isUnitLocked = !previousUnitsComplete;
  
  const getLessonStatus = (lessonId: string, lessonIndex: number): "complete" | "current" | "locked" => {
    // If the entire unit is locked, all lessons are locked
    if (isUnitLocked) {
      return "locked";
    }
    
    if (completedLessonIds.includes(lessonId)) {
      return "complete";
    }
    // First lesson of first unit is always accessible
    if (unitIndex === 0 && lessonIndex === 0) {
      return "current";
    }
    // Check if previous lesson in this unit is complete
    if (lessonIndex > 0) {
      const prevLesson = lessons[lessonIndex - 1];
      if (prevLesson && completedLessonIds.includes(prevLesson.id)) {
        return "current";
      }
    }
    // First lesson of subsequent units - check if previous unit's last lesson is complete
    if (lessonIndex === 0 && previousUnitsComplete) {
      return "current";
    }
    return "locked";
  };

  const isUnitActive = !isUnitLocked && lessons.some((lesson, idx) => getLessonStatus(lesson.id, idx) === "current");
  const currentLessonId = lessons.find((lesson, idx) => getLessonStatus(lesson.id, idx) === "current")?.id;

  const colorMap: Record<string, "green" | "blue" | "orange" | "purple"> = {
    green: "green",
    blue: "blue", 
    orange: "orange",
    purple: "purple",
  };

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-8">
      <UnitBanner 
        title={unit.title}
        description={unit.description || ""}
        color={colorMap[unit.color] || "green"}
        isActive={isUnitActive}
        currentLessonId={currentLessonId ? Number(currentLessonId.slice(-4)) : undefined}
        unitId={unit.id}
        completedLessons={completedLessonsCount}
        totalLessons={lessons.length}
      />

      <div className="flex flex-col items-center space-y-6 py-4">
        {lessons.map((lesson, lessonIndex) => (
          <LessonBubble
            key={lesson.id}
            id={lessonIndex + 1 + (unitIndex * 10)} // Generate numeric ID for routing
            status={getLessonStatus(lesson.id, lessonIndex)}
            position={positionPattern[lessonIndex % positionPattern.length]}
            lessonNumber={lessonIndex + 1}
          />
        ))}
      </div>

      {unitIndex < totalUnits - 1 && (
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-border rounded-full" />
        </div>
      )}
    </div>
  );
}
