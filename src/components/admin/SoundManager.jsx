/**
 * SoundManager – Admin panel for managing sound effects and background music.
 * Supports both URL input and file upload to storage.
 */
import { useState, useRef } from "react";
import { Loader2, Volume2, Upload, Play, Pause, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSoundSettings, useUpdateSoundSetting, useCreateSoundSetting } from "@/hooks/useSoundSettings";
import { supabase } from "@/integrations/supabase/client";
export function SoundManager() {
    const { toast } = useToast();
    const { data: sounds = [], isLoading } = useSoundSettings();
    const updateSound = useUpdateSoundSetting();
    const createSound = useCreateSoundSetting();
    const [playing, setPlaying] = useState(null);
    const [uploading, setUploading] = useState(null);
    const [urlInputs, setUrlInputs] = useState({});
    const audioRef = useRef(null);
    const [newSound, setNewSound] = useState({ sound_key: "", label: "", sound_url: "" });
    const handlePlay = (url, key) => {
        if (playing === key) {
            audioRef.current?.pause();
            setPlaying(null);
            return;
        }
        if (audioRef.current)
            audioRef.current.pause();
        const audio = new Audio(url);
        audio.onended = () => setPlaying(null);
        audio.play().catch(() => toast({ title: "Can't play audio", variant: "destructive" }));
        audioRef.current = audio;
        setPlaying(key);
    };
    const handleUrlSave = async (sound) => {
        const url = urlInputs[sound.id] ?? sound.sound_url ?? "";
        try {
            await updateSound.mutateAsync({ id: sound.id, sound_url: url || null });
            toast({ title: `${sound.label} URL updated!` });
        }
        catch {
            toast({ title: "Error updating sound", variant: "destructive" });
        }
    };
    const handleFileUpload = async (sound, file) => {
        setUploading(sound.id);
        try {
            const ext = file.name.split(".").pop();
            const path = `${sound.sound_key}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("sounds")
                .upload(path, file, { upsert: true });
            if (uploadError)
                throw uploadError;
            const { data: urlData } = supabase.storage.from("sounds").getPublicUrl(path);
            await updateSound.mutateAsync({ id: sound.id, sound_url: urlData.publicUrl });
            setUrlInputs((prev) => ({ ...prev, [sound.id]: urlData.publicUrl }));
            toast({ title: `${sound.label} uploaded!` });
        }
        catch {
            toast({ title: "Upload failed", variant: "destructive" });
        }
        finally {
            setUploading(null);
        }
    };
    const handleCreateSound = async () => {
        if (!newSound.sound_key || !newSound.label) {
            toast({ title: "Key and label are required", variant: "destructive" });
            return;
        }
        try {
            await createSound.mutateAsync({
                sound_key: newSound.sound_key,
                label: newSound.label,
                sound_url: newSound.sound_url || null,
            });
            setNewSound({ sound_key: "", label: "", sound_url: "" });
            toast({ title: "Sound setting created!" });
        }
        catch {
            toast({ title: "Error creating sound", variant: "destructive" });
        }
    };
    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500"/></div>;
    }
    return (<div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Volume2 className="w-5 h-5 text-amber-500"/>
        <h3 className="text-lg font-bold">Sound Effects & Music</h3>
      </div>

      {/* Existing Sounds */}
      <div className="space-y-4">
        {sounds.map((sound) => (<SoundRow key={sound.id} sound={sound} urlInput={urlInputs[sound.id] ?? sound.sound_url ?? ""} onUrlChange={(val) => setUrlInputs((prev) => ({ ...prev, [sound.id]: val }))} onSave={() => handleUrlSave(sound)} onPlay={() => sound.sound_url && handlePlay(sound.sound_url, sound.id)} onFileUpload={(file) => handleFileUpload(sound, file)} onToggleActive={async (active) => {
                await updateSound.mutateAsync({ id: sound.id, is_active: active });
            }} isPlaying={playing === sound.id} isUploading={uploading === sound.id} isSaving={updateSound.isPending}/>))}
      </div>

      {/* Add New Sound */}
      <div className="bg-slate-700 rounded-xl p-4">
        <h4 className="font-bold mb-3 text-amber-400">Add Custom Sound</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Key (unique)</Label>
            <Input value={newSound.sound_key} onChange={(e) => setNewSound({ ...newSound, sound_key: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="level_up"/>
          </div>
          <div>
            <Label>Label</Label>
            <Input value={newSound.label} onChange={(e) => setNewSound({ ...newSound, label: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="Level Up Sound"/>
          </div>
          <div>
            <Label>URL (optional)</Label>
            <Input value={newSound.sound_url} onChange={(e) => setNewSound({ ...newSound, sound_url: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="https://..."/>
          </div>
        </div>
        <Button onClick={handleCreateSound} disabled={createSound.isPending} className="mt-3 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2"/>Add Sound
        </Button>
      </div>
    </div>);
}
function SoundRow({ sound, urlInput, onUrlChange, onSave, onPlay, onFileUpload, onToggleActive, isPlaying, isUploading, isSaving, }) {
    const fileRef = useRef(null);
    return (<div className="bg-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold">{sound.label}</p>
          <p className="text-xs text-slate-400">Key: {sound.sound_key}</p>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={sound.is_active} onCheckedChange={onToggleActive}/>
          {sound.sound_url && (<Button size="sm" variant="ghost" onClick={onPlay} className="text-amber-400">
              {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
            </Button>)}
        </div>
      </div>
      <div className="flex gap-2">
        <Input value={urlInput} onChange={(e) => onUrlChange(e.target.value)} className="bg-slate-600 border-slate-500 flex-1" placeholder="Sound URL..."/>
        <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
          Save
        </Button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                onFileUpload(file);
        }}/>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={isUploading} className="border-slate-500 text-slate-100 bg-transparent hover:bg-slate-700/40">
          {isUploading ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<>
              <Upload className="w-4 h-4 mr-1"/>
              <span>Choose file</span>
            </>)}
        </Button>
      </div>
    </div>);
}
