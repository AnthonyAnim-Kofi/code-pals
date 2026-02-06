/**
 * Learn – Main learning page displaying units and lessons in a zig-zag path layout.
 * Users progress through units sequentially; each unit must be completed before the next unlocks.
 * Uses LanguageIcon for recognizable language icons and LessonPath for visual progression.
 */
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { UnitBanner } from "@/components/UnitBanner";
import { LessonBubble, LessonPath } from "@/components/LessonBubble";
import { useLessonProgress } from "@/hooks/useUserProgress";
import { useLanguages, useUnitsForLanguage, useLessonsForUnit } from "@/hooks/useLanguages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageIcon } from "@/components/LanguageIcon";

/** Repeating position pattern for zig-zag lesson layout */
const positionPattern: ("center" | "left" | "right")[] = ["center", "left", "right", "center", "right", "left"];

export default function Learn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const languageParam = searchParams.get("language");
  const { data: languages = [], isLoading: languagesLoading } = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  // Sync URL ?language= parameter with selected language state
  useEffect(() => {
    if (languageParam && languages.some((l) => l.id === languageParam)) {
      setSelectedLanguage(languageParam);
    }
  }, [languageParam, languages]);
  
  // Auto-select first language when none is selected
  const activeLanguage = selectedLanguage || languageParam || languages[0]?.id || null;
  const currentLanguage = languages.find(l => l.id === activeLanguage);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setSearchParams(value ? { language: value } : {});
  };
  
  const { data: units = [], isLoading: unitsLoading } = useUnitsForLanguage(activeLanguage);
  const { data: lessonProgress = [] } = useLessonProgress();
  
  // Get completed lesson IDs (UUID strings from database)
  const completedLessonIds = lessonProgress
    .filter((p) => p.completed)
    .map((p) => String(p.lesson_id));

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
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Language selector header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {currentLanguage && (
              <LanguageIcon slug={currentLanguage.slug} icon={currentLanguage.icon} size={36} />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1 sm:mb-2 truncate">
                Learn {currentLanguage?.name || "Python"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">
                {currentLanguage?.description || "Master the world's most popular programming language"}
              </p>
            </div>
          </div>
          {languages.length > 1 && (
            <Select value={activeLanguage || undefined} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full sm:w-[200px] shrink-0 bg-background">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    <span className="flex items-center gap-2">
                      <LanguageIcon slug={lang.slug} icon={lang.icon} size={20} />
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Units and Lessons */}
      {unitsLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No units available yet</p>
          <p className="text-sm mt-2">Check back soon for new content!</p>
        </div>
      ) : (
        <DatabaseUnits 
          units={units} 
          completedLessonIds={completedLessonIds}
        />
      )}
    </div>
  );
}

/**
 * DatabaseUnits – Renders all units from the database with lesson tracking.
 * Manages cross-unit lesson data for proper unit locking logic.
 */
function DatabaseUnits({ 
  units, completedLessonIds 
}: { 
  units: any[]; completedLessonIds: string[];
}) {
  const [allLessonsData, setAllLessonsData] = useState<Map<string, string[]>>(new Map());

  const updateLessonsData = useCallback((unitId: string, lessonIds: string[]) => {
    setAllLessonsData(prev => {
      const next = new Map(prev);
      next.set(unitId, lessonIds);
      return next;
    });
  }, []);

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

/**
 * Checks if all lessons in all units before the current one are completed.
 * Required for the linear unit-locking progression system.
 */
function checkPreviousUnitsComplete(
  units: any[], currentUnitIndex: number, 
  completedLessonIds: string[], allLessonsData: Map<string, string[]>
): boolean {
  if (currentUnitIndex === 0) return true;
  
  for (let i = 0; i < currentUnitIndex; i++) {
    const unitId = units[i].id;
    const unitLessons = allLessonsData.get(unitId) || [];
    for (const lessonId of unitLessons) {
      if (!completedLessonIds.includes(lessonId)) return false;
    }
  }
  return true;
}

/**
 * DatabaseUnit – Renders a single unit with its lessons in a zig-zag LessonPath.
 * Handles lesson status logic (complete/current/locked) based on progression.
 */
function DatabaseUnit({ 
  unit, unitIndex, totalUnits, completedLessonIds, 
  previousUnitsComplete, onLessonsLoaded, completedLessonsCount
}: { 
  unit: any; unitIndex: number; totalUnits: number;
  completedLessonIds: string[]; previousUnitsComplete: boolean;
  onLessonsLoaded: (unitId: string, lessonIds: string[]) => void;
  completedLessonsCount: number;
}) {
  const { data: lessons = [], isLoading } = useLessonsForUnit(unit.id);
  
  // Report lessons to parent for cross-unit locking checks
  useEffect(() => {
    if (lessons.length > 0) {
      onLessonsLoaded(unit.id, lessons.map(l => l.id));
    }
  }, [lessons, unit.id, onLessonsLoaded]);

  const isUnitLocked = !previousUnitsComplete;
  
  /** Determines lesson status based on unit lock state and completion history */
  const getLessonStatus = (lessonId: string, lessonIndex: number): "complete" | "current" | "locked" => {
    if (isUnitLocked) return "locked";
    if (completedLessonIds.includes(lessonId)) return "complete";
    if (unitIndex === 0 && lessonIndex === 0) return "current";
    if (lessonIndex > 0) {
      const prevLesson = lessons[lessonIndex - 1];
      if (prevLesson && completedLessonIds.includes(prevLesson.id)) return "current";
    }
    if (lessonIndex === 0 && previousUnitsComplete) return "current";
    return "locked";
  };

  const isUnitActive = !isUnitLocked && lessons.some((lesson, idx) => getLessonStatus(lesson.id, idx) === "current");
  const currentLessonId = lessons.find((lesson, idx) => getLessonStatus(lesson.id, idx) === "current")?.id;

  const colorMap: Record<string, "green" | "blue" | "orange" | "purple"> = {
    green: "green", blue: "blue", orange: "orange", purple: "purple",
  };

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  // Build lesson data for the LessonPath connector lines
  const lessonPathData = lessons.map((lesson, idx) => ({
    id: lesson.id,
    status: getLessonStatus(lesson.id, idx),
    position: positionPattern[idx % positionPattern.length],
  }));

  return (
    <div className="space-y-4">
      <UnitBanner 
        title={unit.title}
        description={unit.description || ""}
        color={colorMap[unit.color] || "green"}
        isActive={isUnitActive}
        currentLessonId={currentLessonId ?? undefined}
        unitId={unit.id}
        completedLessons={completedLessonsCount}
        totalLessons={lessons.length}
      />

      {/* Lesson path with zig-zag layout and connector lines */}
      <LessonPath lessons={lessonPathData}>
        {lessons.map((lesson, lessonIndex) => (
          <LessonBubble
            key={lesson.id}
            id={lesson.id}
            status={getLessonStatus(lesson.id, lessonIndex)}
            position={positionPattern[lessonIndex % positionPattern.length]}
            lessonNumber={lessonIndex + 1}
          />
        ))}
      </LessonPath>

      {/* Unit separator line */}
      {unitIndex < totalUnits - 1 && (
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-border rounded-full" />
        </div>
      )}
    </div>
  );
}
