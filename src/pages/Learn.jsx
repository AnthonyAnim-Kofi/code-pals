/**
 * Learn – Main learning page displaying units and lessons in a zig-zag path layout.
 * Users progress through units sequentially; each unit must be completed before the next unlocks.
 * Uses LanguageIcon for recognizable language icons and LessonPath for visual progression.
 */
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { UnitBanner } from "@/components/UnitBanner";
import { LessonBubble, LessonPath } from "@/components/LessonBubble";
import { useLessonProgress, useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { useLanguages, useUnitsForLanguage, useLessonsForUnit } from "@/hooks/useLanguages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageIcon } from "@/components/LanguageIcon";
import { useTheme } from "@/components/ThemeContext";
import { toast } from "sonner";
import christmasBanner from "@/assets/christmas_banner.png";
import halloweenBanner from "@/assets/halloween_banner.png";
import valentineBanner from "@/assets/valentine_banner.png";
import easterBanner from "@/assets/easter_banner.png";
import newyearBanner from "@/assets/newyear_banner.png";
import lunarBanner from "@/assets/lunar_banner.png";
import stpatricksBanner from "@/assets/stpatricks_banner.png";
import earthBanner from "@/assets/earth_banner.png";
import summerBanner from "@/assets/summer_banner.png";

// Fallbacks for holidays without Local image files (Quota Exhausted)
const autumnBanner = "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=1200";
const diwaliBanner = "https://images.unsplash.com/photo-1605349141071-705a666e5792?auto=format&fit=crop&q=80&w=1200";
const ramadanBanner = "https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?auto=format&fit=crop&q=80&w=1200";
const independenceBanner = "https://images.unsplash.com/photo-1533219057257-4bb9ed5d2cc6?auto=format&fit=crop&q=80&w=1200";
const anniversaryBanner = "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&q=80&w=1200";
/** Repeating position pattern for zig-zag lesson layout */
const positionPattern = ["center", "left", "right", "center", "right", "left"];
export default function Learn() {
    const [searchParams, setSearchParams] = useSearchParams();
    const languageParam = searchParams.get("language");
    const { data: languages = [], isLoading: languagesLoading } = useLanguages();
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const { currentTheme } = useTheme();
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const profileLanguageId = profile?.active_language_id || null;
    // Derive active language: state > URL > profile's active language > first language
    const activeLanguage = selectedLanguage || languageParam || profileLanguageId || languages[0]?.id || null;
    const currentLanguage = languages.find(l => l.id === activeLanguage);
    // Keep URL ?language in sync with active language
    useEffect(() => {
        if (activeLanguage && languageParam !== activeLanguage) {
            setSearchParams({ language: activeLanguage });
        }
    }, [activeLanguage, languageParam, setSearchParams]);
    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
        setSearchParams(value ? { language: value } : {});
        // Persist the language choice to the user's profile
        updateProfile.mutate({ active_language_id: value });
    };
    const { data: units = [], isLoading: unitsLoading } = useUnitsForLanguage(activeLanguage);
    const { data: lessonProgress = [] } = useLessonProgress();
    // Get completed lesson IDs (UUID strings from database)
    const completedLessonIds = lessonProgress
        .filter((p) => p.completed)
        .map((p) => String(p.lesson_id));

    const handleUnitJump = async (unitId) => {
        if (!profile) return;
        try {
            await updateProfile.mutateAsync({ advanced_start_unit_id: unitId });
            toast.success("Jumped to unit! You can now start from here.");
        } catch (err) {
            toast.error("Failed to jump to unit.");
        }
    };
    // Avoid flashing the first language (often Python) before the user's active language loads
    if (languagesLoading || profileLoading) {
        return (<div className="space-y-8">
        <Skeleton className="h-10 w-48"/>
        <Skeleton className="h-24 w-full"/>
        <Skeleton className="h-24 w-full"/>
      </div>);
    }
    return (<div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Language selector header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {currentLanguage && (<LanguageIcon slug={currentLanguage.slug} icon={currentLanguage.icon} size={36}/>)}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1 sm:mb-2 truncate">
                {currentLanguage?.name ? `Learn ${currentLanguage.name}` : "Learn"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">
                {currentLanguage?.description || "Pick a language and start your learning path"}
              </p>
            </div>
          </div>
          {languages.length > 1 && (<Select value={activeLanguage || undefined} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full sm:w-[200px] shrink-0 bg-background">
                <SelectValue placeholder="Select language"/>
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (<SelectItem key={lang.id} value={lang.id}>
                    <span className="flex items-center gap-2">
                      <LanguageIcon slug={lang.slug} icon={lang.icon} size={20}/>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>))}
              </SelectContent>
            </Select>)}
        </div>
      </div>

      {/* Holiday Banners */}
      {(currentTheme === 'theme-christmas' || 
        currentTheme === 'theme-halloween' || 
        currentTheme === 'theme-valentine' || 
        currentTheme === 'theme-easter' ||
        currentTheme === 'theme-newyear' ||
        currentTheme === 'theme-lunar' ||
        currentTheme === 'theme-stpatricks' ||
        currentTheme === 'theme-earth' ||
        currentTheme === 'theme-summer' ||
        currentTheme === 'theme-autumn' || 
        currentTheme === 'theme-diwali' || 
        currentTheme === 'theme-ramadan' || 
        currentTheme === 'theme-independence' ||
        currentTheme === 'theme-anniversary') && (
        <div className="w-full h-32 sm:h-48 md:h-64 rounded-2xl overflow-hidden relative shadow-lg border border-border mt-2 animate-in fade-in zoom-in duration-500">
          <img 
            src={
              currentTheme === 'theme-christmas' ? christmasBanner :
              currentTheme === 'theme-halloween' ? halloweenBanner :
              currentTheme === 'theme-valentine' ? valentineBanner :
              currentTheme === 'theme-easter' ? easterBanner :
              currentTheme === 'theme-newyear' ? newyearBanner :
              currentTheme === 'theme-lunar' ? lunarBanner :
              currentTheme === 'theme-stpatricks' ? stpatricksBanner :
              currentTheme === 'theme-earth' ? earthBanner :
              currentTheme === 'theme-summer' ? summerBanner :
              currentTheme === 'theme-autumn' ? autumnBanner :
              currentTheme === 'theme-diwali' ? diwaliBanner :
              currentTheme === 'theme-ramadan' ? ramadanBanner :
              currentTheme === 'theme-independence' ? independenceBanner :
              currentTheme === 'theme-anniversary' ? anniversaryBanner :
              summerBanner
            } 
            alt="Happy Holidays!" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
            <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-md">
              {currentTheme === 'theme-christmas' ? "Happy Holidays! 🎄" :
               currentTheme === 'theme-halloween' ? "Happy Halloween! 🎃" :
               currentTheme === 'theme-valentine' ? "Happy Valentine's Day! 💖" :
               currentTheme === 'theme-easter' ? "Happy Easter! 🌸" :
               currentTheme === 'theme-newyear' ? "Welcome 2026! 🎆" :
               currentTheme === 'theme-lunar' ? "Happy Lunar New Year! 🏮" :
               currentTheme === 'theme-stpatricks' ? "Happy St. Patrick's Day! 🍀" :
               currentTheme === 'theme-earth' ? "Happy Earth Day! 🌍" :
               currentTheme === 'theme-autumn' ? "Happy Thanksgiving! 🍂" :
               currentTheme === 'theme-diwali' ? "Happy Diwali! 🪔" :
               currentTheme === 'theme-ramadan' ? "Ramadan Kareem! 🌙" :
               currentTheme === 'theme-independence' ? "Happy Independence Day! 🇺🇸" :
               currentTheme === 'theme-anniversary' ? "Happy Site Anniversary! 🎉" :
               "Enjoy Your Summer! ☀️"}
            </h2>
          </div>
        </div>
      )}

      {/* Units and Lessons */}
      {unitsLoading ? (<div className="space-y-8">
          <Skeleton className="h-24 w-full"/>
          <Skeleton className="h-24 w-full"/>
        </div>) : units.length === 0 ? (<div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No units available yet</p>
          <p className="text-sm mt-2">Check back soon for new content!</p>
        </div>) : (<DatabaseUnits units={units} completedLessonIds={completedLessonIds} profile={profile} onJump={handleUnitJump}/>)}
    </div>);
}
/**
 * DatabaseUnits – Renders all units from the database with lesson tracking.
 * Manages cross-unit lesson data for proper unit locking logic.
 */
function DatabaseUnits({ units, completedLessonIds, profile, onJump }) {
    const [allLessonsData, setAllLessonsData] = useState(new Map());
    const updateLessonsData = useCallback((unitId, lessonIds) => {
        setAllLessonsData(prev => {
            const next = new Map(prev);
            next.set(unitId, lessonIds);
            return next;
        });
    }, []);
    const getCompletedLessonsForUnit = (unitId) => {
        const unitLessons = allLessonsData.get(unitId) || [];
        return unitLessons.filter(id => completedLessonIds.includes(id)).length;
    };
    return (<>
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
            userExperience={profile?.coding_experience}
            advancedStartUnitId={profile?.advanced_start_unit_id}
            onJump={onJump}
            allUnits={units}
        />
      ))}
    </>);
}
/**
 * Checks if all lessons in all units before the current one are completed.
 * Required for the linear unit-locking progression system.
 */
function checkPreviousUnitsComplete(units, currentUnitIndex, completedLessonIds, allLessonsData) {
    if (currentUnitIndex === 0)
        return true;
    for (let i = 0; i < currentUnitIndex; i++) {
        const unitId = units[i].id;
        const unitLessons = allLessonsData.get(unitId) || [];
        if (unitLessons.length === 0) return false; // Not loaded yet
        for (const lessonId of unitLessons) {
            if (!completedLessonIds.includes(lessonId))
                return false;
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
    previousUnitsComplete, onLessonsLoaded, completedLessonsCount, 
    userExperience, advancedStartUnitId, onJump, allUnits 
}) {
    const { data: lessons = [], isLoading } = useLessonsForUnit(unit.id);
    // Report lessons to parent for cross-unit locking checks
    useEffect(() => {
        if (lessons.length > 0) {
            onLessonsLoaded(unit.id, lessons.map(l => l.id));
        }
    }, [lessons, unit.id, onLessonsLoaded]);

    const canSkipLocks = userExperience === 'intermediate' || userExperience === 'advanced';
    
    // Check if this unit or any later unit is the "advanced start" point
    const jumpedUnitIndex = allUnits.findIndex(u => u.id === advancedStartUnitId);
    const isUnlockedByJump = canSkipLocks && jumpedUnitIndex !== -1 && unitIndex <= jumpedUnitIndex;

    const isUnitLocked = !previousUnitsComplete && !isUnlockedByJump;

    /** Determines lesson status based on unit lock state and completion history */
    const getLessonStatus = (lessonId, lessonIndex) => {
        if (completedLessonIds.includes(lessonId))
            return "complete";

        if (isUnitLocked)
            return "locked";
        
        if (unitIndex === 0 && lessonIndex === 0)
            return "current";
            
        if (lessonIndex > 0) {
            const prevLesson = lessons[lessonIndex - 1];
            if (prevLesson && completedLessonIds.includes(prevLesson.id))
                return "current";
        }
        
        if (lessonIndex === 0 && (previousUnitsComplete || isUnlockedByJump))
            return "current";
            
        return "locked";
    };
    const isUnitActive = isUnlockedByJump ? true : (!isUnitLocked && lessons.some((lesson, idx) => getLessonStatus(lesson.id, idx) === "current"));
    const currentLessonId = lessons.find((lesson, idx) => getLessonStatus(lesson.id, idx) === "current")?.id;
    const colorMap = {
        green: "green", blue: "blue", orange: "orange", purple: "purple",
    };
    if (isLoading)
        return <Skeleton className="h-24 w-full"/>;
    // Build lesson data for the LessonPath connector lines
    const lessonPathData = lessons.map((lesson, idx) => ({
        id: lesson.id,
        status: getLessonStatus(lesson.id, idx),
        position: positionPattern[idx % positionPattern.length],
    }));

    return (<div className="space-y-4">
      <UnitBanner 
        title={unit.title} 
        description={unit.description || ""} 
        color={colorMap[unit.color] || "green"} 
        isActive={isUnitActive} 
        currentLessonId={currentLessonId ?? undefined} 
        unitId={unit.id} 
        completedLessons={completedLessonsCount} 
        totalLessons={lessons.length}
        canJump={canSkipLocks}
        isLocked={isUnitLocked}
        onJump={onJump}
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
            showMascot={!isUnlockedByJump}
          />
        ))}
      </LessonPath>

      {/* Unit separator line */}
      {unitIndex < totalUnits - 1 && (<div className="flex justify-center">
          <div className="w-1 h-8 bg-border rounded-full"/>
        </div>)}
    </div>);
}
