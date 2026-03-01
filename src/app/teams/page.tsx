"use client";

import { useState } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KitDesign, CrestType, StadiumSurface, Team } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
  const { teams, addTeam, deleteTeam } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New team form state
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [stadium, setStadium] = useState('');
  const [capacity, setCapacity] = useState(25000);
  const [surface, setSurface] = useState<StadiumSurface>('grass');
  
  // Aesthetic state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [kitDesign, setKitDesign] = useState<KitDesign>('solid');
  const [crestType, setCrestType] = useState<CrestType>('shield');

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Name is required and Abbreviation must be 3 letters.", variant: "destructive" });
      return;
    }
    
    const newTeam: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      abbreviation: abbreviation.toUpperCase(),
      rating,
      stadiumName: stadium,
      stadiumCapacity: capacity,
      stadiumSurface: surface,
      primaryColor,
      secondaryColor,
      kitDesign,
      crestType,
      players: []
    };

    addTeam(newTeam);

    // Reset fields
    setName('');
    setAbbreviation('');
    setRating(50);
    setStadium('');
    setCapacity(25000);
    setIsDialogOpen(false);
    
    toast({ title: "Team Created", description: `${name} has been added successfully.` });
  };

  const renderKitPreview = (primary: string, secondary: string, design: KitDesign) => {
    return (
      <div className="w-full h-32 rounded-xl relative overflow-hidden border border-border shadow-inner" style={{ backgroundColor: primary }}>
        {design === 'stripes' && (
          <div className="absolute inset-0 flex">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 h-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {design === 'hoops' && (
          <div className="absolute inset-0 flex flex-col">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 w-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {design === 'halves' && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 h-full" style={{ backgroundColor: secondary }} />
            <div className="flex-1 h-full" />
          </div>
        )}
        {design === 'gradient' && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[40px] font-black opacity-20 uppercase tracking-tighter">KIT PREVIEW</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your clubs and rosters.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6">
              <Plus className="w-5 h-5 mr-2" /> Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-card border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-muted/20 border-b">
              <DialogTitle className="text-2xl">Club Customization</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-12">
                <TabsTrigger value="general" className="data-[state=active]:bg-card rounded-none border-b-2 border-transparent data-[state=active]:border-primary">General</TabsTrigger>
                <TabsTrigger value="aesthetics" className="data-[state=active]:bg-card rounded-none border-b-2 border-transparent data-[state=active]:border-accent">Aesthetics</TabsTrigger>
                <TabsTrigger value="stadium" className="data-[state=active]:bg-card rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500">Stadium</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input id="name" placeholder="e.g. Madrid Stars" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="abbr">Abbreviation</Label>
                      <Input id="abbr" maxLength={3} placeholder="MDR" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Overall Rating</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} step={1} className="flex-1" />
                        <span className="font-mono font-bold text-primary min-w-8">{rating}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="aesthetics" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" className="w-10 h-10 rounded cursor-pointer border-none" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" className="w-10 h-10 rounded cursor-pointer border-none" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                          <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Kit Pattern</Label>
                        <Select value={kitDesign} onValueChange={(v: any) => setKitDesign(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="stripes">Vertical Stripes</SelectItem>
                            <SelectItem value="hoops">Horizontal Hoops</SelectItem>
                            <SelectItem value="halves">Halves</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Crest Shape</Label>
                        <Select value={crestType} onValueChange={(v: any) => setCrestType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shield">Classic Shield</SelectItem>
                            <SelectItem value="circle">Round Circle</SelectItem>
                            <SelectItem value="square">Modern Square</SelectItem>
                            <SelectItem value="modern">Minimalist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Kit Preview</Label>
                    {renderKitPreview(primaryColor, secondaryColor, kitDesign)}
                  </div>
                </TabsContent>

                <TabsContent value="stadium" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="stadium">Stadium Name</Label>
                    <Input id="stadium" placeholder="e.g. Santiago Arena" value={stadium} onChange={(e) => setStadium(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Surface Type</Label>
                      <Select value={surface} onValueChange={(v: any) => setSurface(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass">Natural Grass</SelectItem>
                          <SelectItem value="artificial">Artificial Turf</SelectItem>
                          <SelectItem value="clay">Clay</SelectItem>
                          <SelectItem value="hardcourt">Hardcourt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-6 bg-muted/20 border-t flex justify-end">
              <Button onClick={handleAddTeam} className="w-full md:w-auto px-8 h-11 bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                Confirm & Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg focus-visible:ring-primary" 
          placeholder="Search teams by name or abbreviation..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:ring-2 hover:ring-primary/50 transition-all group overflow-hidden shadow-xl">
            <div className="h-32 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-40" 
                style={{ backgroundColor: team.primaryColor }} 
              />
              <div 
                className="absolute inset-0 mix-blend-multiply" 
                style={{ 
                  background: team.kitDesign === 'stripes' 
                    ? `repeating-linear-gradient(90deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.kitDesign === 'hoops'
                    ? `repeating-linear-gradient(0deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.kitDesign === 'halves'
                    ? `linear-gradient(90deg, ${team.secondaryColor} 50%, transparent 50%)`
                    : team.kitDesign === 'gradient'
                    ? `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
                    : 'transparent'
                }} 
              />
              <div className="absolute inset-x-6 -bottom-8 flex items-end">
                <div className={cn(
                  "w-20 h-20 bg-card shadow-2xl flex items-center justify-center relative z-10 border-4 border-card",
                  team.crestType === 'shield' && "rounded-b-3xl rounded-t-lg",
                  team.crestType === 'circle' && "rounded-full",
                  team.crestType === 'square' && "rounded-2xl",
                  team.crestType === 'modern' && "rounded-tr-3xl rounded-bl-3xl"
                )}>
                  <Shield className="w-10 h-10" style={{ color: team.primaryColor }} />
                </div>
              </div>
            </div>
            <CardHeader className="pt-12 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-black">{team.name}</CardTitle>
                  <CardDescription className="font-mono font-bold text-accent uppercase tracking-widest">{team.abbreviation}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">OVR</p>
                  <p className="text-3xl font-black text-primary leading-none">{team.rating}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> Stadium
                  </span>
                  <span className="text-sm font-bold truncate">{team.stadiumName || 'TBA'}</span>
                </div>
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Capacity</span>
                  <span className="text-sm font-bold">{(team.stadiumCapacity || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                <Palette className="w-4 h-4 text-accent" />
                <div className="flex-1 flex gap-1">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: team.primaryColor }} />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: team.secondaryColor }} />
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{team.kitDesign}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl" variant="secondary" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Manage Roster
                </Button>
                <Button variant="destructive" size="icon" className="rounded-xl" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}