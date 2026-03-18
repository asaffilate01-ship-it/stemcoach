import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, Copy, UserPlus, BookOpen, ArrowRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const subjectOptions = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Economics", "Business Studies", "Geography", "History", "Psychology",
];

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  created_by: string;
  join_code: string;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export default function StudyGroups() {
  useDocumentTitle("Study Groups | STEMCoach");
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", subject: "Mathematics", description: "" });

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from("study_groups").select("*").order("created_at", { ascending: false });
    if (data) setGroups(data);

    if (user) {
      const { data: memberships } = await supabase
        .from("study_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      setMyGroups(memberships?.map((m) => m.group_id) || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newGroup.name.trim()) return;
    const { data, error } = await supabase
      .from("study_groups")
      .insert({ name: newGroup.name, subject: newGroup.subject, description: newGroup.description || null, created_by: user.id })
      .select()
      .single();

    if (error) { toast.error("Failed to create group"); return; }
    if (data) {
      await supabase.from("study_group_members").insert({ group_id: data.id, user_id: user.id });
      toast.success("Group created!");
      setCreateOpen(false);
      setNewGroup({ name: "", subject: "Mathematics", description: "" });
      fetchGroups();
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from("study_group_members").insert({ group_id: groupId, user_id: user.id });
    if (error) {
      if (error.code === "23505") toast.info("You're already a member");
      else toast.error("Failed to join group");
      return;
    }
    toast.success("Joined group!");
    fetchGroups();
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    const group = groups.find((g) => g.join_code === joinCode.trim());
    if (!group) { toast.error("Invalid join code"); return; }
    handleJoin(group.id);
    setJoinCode("");
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    toast.success("Left group");
    fetchGroups();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">👥 Study Groups</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create or join groups to study together</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Study Group</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Group Name</Label>
                  <Input placeholder="e.g. GCSE Maths Revision" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={newGroup.subject} onValueChange={(v) => setNewGroup({ ...newGroup, subject: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea placeholder="What's this group about?" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Join by Code */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-2 p-3">
            <UserPlus className="h-4 w-4 text-primary shrink-0" />
            <Input placeholder="Enter join code..." value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="h-9 bg-background" />
            <Button size="sm" onClick={handleJoinByCode} className="shrink-0">Join</Button>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Groups */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading groups...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No groups found. Create one!</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((group, i) => {
              const isMember = myGroups.includes(group.id);
              const isOwner = group.created_by === user?.id;
              return (
                <motion.div key={group.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`border-border/50 transition-all ${isMember ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                            {isOwner && <Crown className="h-3 w-3 text-yellow-500" />}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{group.subject}</span>
                          </div>
                        </div>
                        <Users className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                      {group.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => copyCode(group.join_code)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" /> {group.join_code}
                        </button>
                        {isMember ? (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleLeave(group.id)}>Leave</Button>
                        ) : (
                          <Button size="sm" className="text-xs h-7 gap-1" onClick={() => handleJoin(group.id)}>
                            <UserPlus className="h-3 w-3" /> Join
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
