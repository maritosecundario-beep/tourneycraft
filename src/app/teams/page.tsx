'use client';

import { useState } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

export default function TeamsPage() {
  const { teams, addTeam, deleteTeam } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New team form state
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(1000);
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('parquet');
  
  // Aesthetic state
  const [primaryColor, setPrimaryColor] = useState(PREDEFINED_COLORS[10]); // Default Blue
  const [secondaryColor, setSecondaryColor] = useState(PREDEFINED_COLORS[19]); // Default White
  const [uniformStyle, setUniformStyle] = useState<UniformStyle>('solid');
  const [emblemShape, setEmblemShape] = useState<EmblemShape>('modern');

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
      venueName: venueName || 'Main Arena',
      venueCapacity,
      venueSurface,
      primaryColor,
      secondaryColor,
      uniformStyle,
      emblemShape,
      players: []
    };

    addTeam(newTeam);

    // Reset
    setName('');
    setAbbreviation('');
    setRating(50);
    setVenueName('');
    setIsDialogOpen(false);
    
    toast({ title: "Team Created", description: `${name} has been established.` });
  };

  const renderUniformPreview = (primary: string, secondary: string, style: UniformStyle) => {
    return (
      <div className="w-full h-32 rounded-xl relative overflow-hidden border border-border shadow-inner" style={{ backgroundColor: primary }}>
        {style === 'stripes' && (
          <div className="absolute inset-0 flex">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 h-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {style === 'hoops' && (
          <div className="absolute inset-0 flex flex-col">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 w-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {style === 'halves' && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 h-full" style={{ backgroundColor: secondary }} />
            <div className="flex-1 h-full" />
          </div>
        )}
        {style === 'gradient' && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        )}
        {style === 'minimal' && (
          <div className="absolute top-0 right-0 w-8 h-full" style={{ backgroundColor: secondary }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[30px] font-black opacity-10 uppercase tracking-widest text-foreground">IDENTITY</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations & Teams</h1>
          <p className="text-muted-foreground">Define your rosters and visual identities.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6">
              <Plus className="w-5 h-5 mr-2" /> New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] bg-card border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-muted/20 border-b">
              <DialogTitle className="text-2xl">Identity Builder</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-12">
                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">General</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent">Branding</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500">Venue</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input id="name" placeholder="e.g. Phoenix Rising" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="abbr">Abbreviation</Label>
                      <Input id="abbr" maxLength={3} placeholder="PHX" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Performance Level</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} />
                        <span className="font-mono font-bold text-primary min-w-8">{rating}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Primary Color</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                                primaryColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Accent Color</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setSecondaryColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                                secondaryColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Visual Style</Label>
                        <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="stripes">Vertical Stripes</SelectItem>
                            <SelectItem value="hoops">Horizontal Hoops</SelectItem>
                            <SelectItem value="halves">Halves</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="minimal">Minimal Accent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Emblem Shape</Label>
                        <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shield">Classic Shield</SelectItem>
                            <SelectItem value="circle">Circular Logo</SelectItem>
                            <SelectItem value="square">Quadrangular</SelectItem>
                            <SelectItem value="modern">Geometric Modern</SelectItem>
                            <SelectItem value="diamond">Diamond Shape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Real-time Identity Preview</Label>
                    {renderUniformPreview(primaryColor, secondaryColor, uniformStyle)}
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="venue">Venue Name (Arena/Court/Field)</Label>
                    <Input id="venue" placeholder="e.g. Apex Center" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Total Capacity</Label>
                      <Input id="capacity" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Surface/Environment</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parquet">Parquet/Wood</SelectItem>
                          <SelectItem value="hardcourt">Hardcourt</SelectItem>
                          <SelectItem value="grass">Grass/Turf</SelectItem>
                          <SelectItem value="ice">Ice Rink</SelectItem>
                          <SelectItem value="clay">Clay</SelectItem>
                          <SelectItem value="sand">Sand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-6 bg-muted/20 border-t flex justify-end">
              <Button onClick={handleAddTeam} className="w-full md:w-auto px-8 h-11 bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                Establish Organization
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg focus-visible:ring-primary" 
          placeholder="Filter by name, ID or abbreviation..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:ring-2 hover:ring-primary/50 transition-all group overflow-hidden shadow-xl">
            <div className="h-32 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40" style={{ backgroundColor: team.primaryColor }} />
              <div 
                className="absolute inset-0 mix-blend-multiply" 
                style={{ 
                  background: team.uniformStyle === 'stripes' 
                    ? `repeating-linear-gradient(90deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.uniformStyle === 'hoops'
                    ? `repeating-linear-gradient(0deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.uniformStyle === 'halves'
                    ? `linear-gradient(90deg, ${team.secondaryColor} 50%, transparent 50%)`
                    : team.uniformStyle === 'gradient'
                    ? `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
                    : team.uniformStyle === 'minimal'
                    ? `linear-gradient(90deg, transparent 80%, ${team.secondaryColor} 80%)`
                    : 'transparent'
                }} 
              />
              <div className="absolute inset-x-6 -bottom-8 flex items-end">
                <div className={cn(
                  "w-20 h-20 bg-card shadow-2xl flex items-center justify-center relative z-10 border-4 border-card transition-transform group-hover:scale-110",
                  team.emblemShape === 'shield' && "rounded-b-3xl rounded-t-lg",
                  team.emblemShape === 'circle' && "rounded-full",
                  team.emblemShape === 'square' && "rounded-2xl",
                  team.emblemShape === 'modern' && "rounded-tr-3xl rounded-bl-3xl",
                  team.emblemShape === 'diamond' && "rotate-45"
                )}>
                  <div className={cn(team.emblemShape === 'diamond' && "-rotate-45")}>
                    <Shield className="w-10 h-10" style={{ color: team.primaryColor }} />
                  </div>
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
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">POWER</p>
                  <p className="text-3xl font-black text-primary leading-none">{team.rating}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> Venue
                  </span>
                  <span className="text-sm font-bold truncate">{team.venueName}</span>
                </div>
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Surface
                  </span>
                  <span className="text-sm font-bold capitalize">{team.venueSurface}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                <Palette className="w-4 h-4 text-accent" />
                <div className="flex-1 flex gap-1">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: team.primaryColor }} />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: team.secondaryColor }} />
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{team.uniformStyle}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl" variant="secondary" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Roster
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
