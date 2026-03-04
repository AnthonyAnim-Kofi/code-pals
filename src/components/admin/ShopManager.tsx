/**
 * ShopManager – Admin panel for managing shop items (add/edit/delete).
 */
import { useState } from "react";
import { Loader2, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useShopItems, useCreateShopItem, useUpdateShopItem, useDeleteShopItem,
} from "@/hooks/useShopItems";
import { AdminEditDialog, EditField } from "./AdminEditDialog";

const actionTypes = [
  { value: "heart_refill", label: "Heart Refill" },
  { value: "streak_freeze", label: "Streak Freeze" },
  { value: "double_xp", label: "Double XP" },
  { value: "custom", label: "Custom" },
];

const colorOptions = [
  { value: "bg-destructive", label: "Red" },
  { value: "bg-secondary", label: "Blue" },
  { value: "bg-golden", label: "Gold" },
  { value: "bg-primary", label: "Primary" },
  { value: "bg-green-600", label: "Green" },
  { value: "bg-purple-600", label: "Purple" },
];

export function ShopManager() {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useShopItems();
  const createItem = useCreateShopItem();
  const updateItem = useUpdateShopItem();
  const deleteItem = useDeleteShopItem();

  const [newItem, setNewItem] = useState({
    title: "", description: "", icon: "🎁", price: 100,
    currency: "gems", color: "bg-primary", action_type: "custom",
    is_active: true, order_index: 0,
  });

  const [editDialog, setEditDialog] = useState<{
    open: boolean; title: string; fields: EditField[];
    initialValues: Record<string, string>;
    onSave: (values: Record<string, string>) => Promise<void>;
  }>({ open: false, title: "", fields: [], initialValues: {}, onSave: async () => {} });

  const handleCreate = async () => {
    if (!newItem.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      await createItem.mutateAsync({ ...newItem, order_index: items.length });
      setNewItem({ title: "", description: "", icon: "🎁", price: 100, currency: "gems", color: "bg-primary", action_type: "custom", is_active: true, order_index: 0 });
      toast({ title: "Shop item created!" });
    } catch {
      toast({ title: "Error creating item", variant: "destructive" });
    }
  };

  const editItem = (item: any) => {
    setEditDialog({
      open: true,
      title: `Edit ${item.title}`,
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "icon", label: "Icon (Emoji)", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "color", label: "Color", type: "select", options: colorOptions },
        { key: "action_type", label: "Action Type", type: "select", options: actionTypes },
      ],
      initialValues: {
        title: item.title, description: item.description, icon: item.icon,
        price: String(item.price), color: item.color, action_type: item.action_type,
      },
      onSave: async (values) => {
        await updateItem.mutateAsync({
          id: item.id, title: values.title, description: values.description,
          icon: values.icon, price: parseInt(values.price) || 100,
          color: values.color, action_type: values.action_type,
        });
        toast({ title: "Shop item updated!" });
      },
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <AdminEditDialog {...editDialog} onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))} />

      {/* Create Form */}
      <div className="bg-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">Add Shop Item</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="XP Boost" />
          </div>
          <div>
            <Label>Icon (Emoji)</Label>
            <Input value={newItem.icon} onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="🎁" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="Boost your XP earning" />
          </div>
          <div>
            <Label>Price (Gems)</Label>
            <Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} className="bg-slate-600 border-slate-500" min={0} />
          </div>
          <div>
            <Label>Action Type</Label>
            <Select value={newItem.action_type} onValueChange={(v) => setNewItem({ ...newItem, action_type: v })}>
              <SelectTrigger className="bg-slate-600 border-slate-500"><SelectValue /></SelectTrigger>
              <SelectContent>
                {actionTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <Select value={newItem.color} onValueChange={(v) => setNewItem({ ...newItem, color: v })}>
              <SelectTrigger className="bg-slate-600 border-slate-500"><SelectValue /></SelectTrigger>
              <SelectContent>
                {colorOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={createItem.isPending} className="mt-4 bg-amber-600 hover:bg-amber-700">
          {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Add Item
        </Button>
      </div>

      {/* Existing Items */}
      <div className="bg-slate-700 rounded-xl p-6">
        <h4 className="font-bold mb-4 text-amber-400">Shop Items ({items.length})</h4>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-3 bg-slate-600 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <p className="font-semibold truncate">{item.title}</p>
                    {!item.is_active && <span className="text-xs bg-red-600 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-amber-600">💎 {item.price}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-500">{item.action_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => editItem(item)} className="text-amber-400 hover:text-amber-300">✏️</Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    if (confirm(`Delete "${item.title}"?`)) deleteItem.mutate(item.id);
                  }} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-slate-400 text-center py-4">No shop items</p>}
        </div>
      </div>
    </div>
  );
}
