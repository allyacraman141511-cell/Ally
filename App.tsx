
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Bed, CalendarDays, Users, CreditCard, Brush, 
  BarChart3, LogOut, Plus, Search, CheckCircle2, 
  Menu, X, Printer, User as UserIcon, Shield, History, ArrowLeftRight, 
  ChevronLeft, ChevronRight, Settings, Save, Trash2, 
  Download, AlertTriangle, UserCheck, FileText, Calendar, Zap, MessageSquare,
  Zap as WalkInIcon
} from 'lucide-react';
import { 
  Room, Booking, Guest, Payment, User, UserRole, 
  RoomStatus, RoomType, PaymentMethod, ActivityLog, HotelSettings 
} from './types';
import { db } from './db';
import { HusLogo } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hotelSettings, setHotelSettings] = useState<HotelSettings>(db.getSettings());

  // Search & Navigation State
  const [bookingSearch, setBookingSearch] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [calendarView, setCalendarView] = useState<'day' | 'month'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Modals
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [isRoomEditModalOpen, setIsRoomEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [editingRoom, setEditingRoom] = useState<Partial<Room>>({});
  const [editingUser, setEditingUser] = useState<Partial<User>>({ role: UserRole.STAFF, isActive: true });
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  
  const [bookingForm, setBookingForm] = useState({
    guestName: '', guestPhone: '', guestEmail: '', guestIdNum: '',
    checkIn: formatDate(new Date()), checkOut: formatDate(new Date(Date.now() + 86400000)),
    numGuests: 1, paymentMethod: PaymentMethod.CASH, initialPayment: 0,
    selectedRoomId: null as number | null,
    specialRequests: '',
    isWalkIn: false
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRooms(db.getRooms());
    setBookings(db.getBookings());
    setGuests(db.getGuests());
    setPayments(db.getPayments());
    setLogs(db.getLogs());
    setHotelSettings(db.getSettings());
    
    let savedUsers = db.getUsers();
    if (!savedUsers.find(u => u.username === 'allyacraman')) {
      const superAdmin: User = { id: 'sa', name: 'Ally Acraman', username: 'allyacraman', password: 'password123', role: UserRole.SUPER_ADMIN, isActive: true, createdAt: new Date().toISOString() };
      savedUsers = [superAdmin, ...savedUsers];
      db.saveUsers(savedUsers);
    }
    setUsers(savedUsers);
  };

  const createLog = (action: ActivityLog['actionType'], type: ActivityLog['entityType'], id: string, details: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = { id: Math.random().toString(36).substr(2, 9), userId: currentUser.id, userName: currentUser.name, role: currentUser.role, actionType: action, entityType: type, entityId: id, details, timestamp: new Date().toISOString() };
    const updated = [newLog, ...db.getLogs()].slice(0, 100);
    setLogs(updated); db.saveLogs(updated);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password && u.isActive);
    if (user) { 
      setCurrentUser(user); 
      createLog('SYSTEM', 'SYSTEM', user.id, `Session started for ${user.name}.`); 
    } else {
      alert('Authentication failed.');
    }
  };

  const saveRoomSettings = () => {
    if (!editingRoom.id) return;
    const updated = rooms.map(r => r.id === editingRoom.id ? { ...r, ...editingRoom } as Room : r);
    setRooms(updated); db.saveRooms(updated);
    createLog('EDIT', 'ROOM', editingRoom.id.toString(), `Unit ${editingRoom.number} master file updated.`);
    setIsRoomEditModalOpen(false);
  };

  const saveUserData = () => {
    let updated: User[];
    if (editingUser.id) { 
      updated = users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u); 
      createLog('EDIT', 'USER', editingUser.id, `Personnel file for ${editingUser.name} modified.`);
    } else { 
      const newUser = { ...editingUser, id: 'U'+Date.now(), password: 'password123', createdAt: new Date().toISOString() } as User; 
      updated = [...users, newUser]; 
      createLog('CREATE', 'USER', newUser.id, `New staff entry: ${newUser.name}.`);
    }
    setUsers(updated); db.saveUsers(updated); setIsUserModalOpen(false);
  };

  const openBookingModal = (roomId?: number, date?: string, isWalkIn: boolean = false) => {
    setBookingForm({
      guestName: '', guestPhone: '', guestEmail: '', guestIdNum: '',
      checkIn: isWalkIn ? formatDate(new Date()) : (date || formatDate(new Date())), 
      checkOut: isWalkIn ? formatDate(new Date(Date.now() + 86400000)) : formatDate(new Date((date ? new Date(date).getTime() : Date.now()) + 86400000)),
      numGuests: 1, paymentMethod: PaymentMethod.CASH, initialPayment: 0,
      selectedRoomId: roomId || null,
      specialRequests: '',
      isWalkIn
    });
    setBookingModalOpen(true);
  };

  const handleCreateBooking = () => {
    if (!bookingForm.selectedRoomId) { alert("Select a room."); return; }
    const bookingId = 'B' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const guestId = 'G' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const room = rooms.find(r => r.id === bookingForm.selectedRoomId)!;
    
    const newBooking: Booking = { 
      id: bookingId, 
      roomId: room.id, 
      guestId, 
      checkIn: bookingForm.checkIn, 
      checkOut: bookingForm.checkOut, 
      numGuests: bookingForm.numGuests, 
      totalAmount: room.baseRate, 
      paidAmount: bookingForm.initialPayment, 
      status: bookingForm.checkIn === formatDate(new Date()) ? 'CHECKED_IN' : 'PENDING', 
      createdAt: new Date().toISOString(), 
      createdBy: currentUser!.id, 
      specialRequests: bookingForm.specialRequests 
    };
    const newGuest: Guest = { id: guestId, name: bookingForm.guestName, phone: bookingForm.guestPhone, email: bookingForm.guestEmail, idNumber: bookingForm.guestIdNum };
    
    if (bookingForm.initialPayment > 0) {
      const p: Payment = { id: 'P'+Date.now(), bookingId, amount: bookingForm.initialPayment, method: bookingForm.paymentMethod, date: formatDate(new Date()), recordedBy: currentUser!.id };
      const updatedPayments = [...payments, p];
      db.savePayments(updatedPayments); setPayments(updatedPayments);
    }

    const updatedBookings = [...bookings, newBooking];
    const updatedGuests = [...guests, newGuest];
    const updatedRooms = rooms.map(r => r.id === room.id ? { ...r, status: newBooking.status === 'CHECKED_IN' ? RoomStatus.OCCUPIED : RoomStatus.RESERVED } : r);
    
    db.saveBookings(updatedBookings); setBookings(updatedBookings);
    db.saveGuests(updatedGuests); setGuests(updatedGuests);
    db.saveRooms(updatedRooms); setRooms(updatedRooms);
    
    createLog('CREATE', 'BOOKING', bookingId, `${bookingForm.isWalkIn ? 'Walk-In' : 'Reservation'} for ${newGuest.name} confirmed.`);
    setBookingModalOpen(false);
  };

  const stats = useMemo(() => ({
    occ: rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
    ready: rooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
    cleaning: rooms.filter(r => r.status === RoomStatus.CLEANING).length,
    rev: payments.filter(p => p.date === formatDate(new Date())).reduce((s, p) => s + p.amount, 0),
    totalUnits: rooms.length
  }), [rooms, payments]);

  const canAccessFull = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.MANAGER;
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
        <div className="w-full max-w-sm bg-white p-12 rounded-[48px] shadow-2xl border border-stone-100">
          <HusLogo className="mb-10" />
          <h2 className="text-xl font-bold text-center mb-8 text-[#4A3728]">Personnel Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="User ID" className="w-full p-4 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button type="submit" className="w-full py-4 bg-[#4A3728] text-white rounded-xl font-bold shadow-lg hover:bg-[#8B5E3C] transition-colors">Authenticate Session</button>
          </form>
          <p className="mt-8 text-center text-[10px] font-black uppercase text-stone-300 tracking-[0.3em]">Secure Terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#4A3728] overflow-hidden">
      <aside className={`no-print ${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#4A3728] text-white transition-all duration-300 flex flex-col z-50`}>
        <div className="p-8 flex justify-center">{isSidebarOpen ? <HusLogo className="invert" /> : <div className="font-bold text-xl">H</div>}</div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Summary' },
            { id: 'reservations', icon: FileText, label: 'Reservations' },
            { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
            { id: 'rooms', icon: Bed, label: 'Unit Master' },
            { id: 'housekeeping', icon: Brush, label: 'Cleaning' },
            { id: 'guests', icon: Users, label: 'Registry' },
            { id: 'financials', icon: BarChart3, label: 'Financials', admin: true },
            { id: 'team', icon: Shield, label: 'Team Hub', admin: true },
            { id: 'settings', icon: Settings, label: 'System', admin: true }
          ].map(item => (!item.admin || canAccessFull) && (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-[#8B5E3C] shadow-md' : 'hover:bg-white/5'}`}>
              <item.icon className="w-5 h-5 shrink-0" /> {isSidebarOpen && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setCurrentUser(null)} className="p-8 text-stone-400 hover:text-white flex items-center gap-3 transition-colors"><LogOut className="w-5 h-5" /> {isSidebarOpen && "Sign Out"}</button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="no-print h-20 px-10 border-b border-stone-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
            <h1 className="text-xl font-black capitalize tracking-tight">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block"><p className="text-sm font-black">{currentUser.name}</p><p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{currentUser.role.replace('_', ' ')}</p></div>
            <div className="w-10 h-10 rounded-xl bg-[#D4A373] flex items-center justify-center text-white shadow-md"><UserIcon className="w-5 h-5" /></div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-[#4A3728]">Hus Hotel Summary</h2><p className="text-stone-400 font-bold">28 Unit Property Management</p></div>
                <div className="flex gap-4">
                  <button onClick={() => openBookingModal(undefined, undefined, true)} className="bg-[#8B5E3C] text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-transform active:scale-95"><WalkInIcon className="w-5 h-5 text-amber-300" /> Walk-In</button>
                  <button onClick={() => openBookingModal(undefined, undefined, false)} className="bg-[#4A3728] text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-transform active:scale-95"><Plus className="w-5 h-5" /> Reservation</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Occupied', val: `${stats.occ}/${stats.totalUnits}`, icon: Bed, color: 'emerald' },
                  { label: 'Ready', val: stats.ready, icon: CheckCircle2, color: 'blue' },
                  { label: 'Cleaning', val: stats.cleaning, icon: Brush, color: 'amber' },
                  { label: 'Revenue Today', val: `₱${stats.rev.toLocaleString()}`, icon: CreditCard, color: 'emerald' }
                ].map(card => (
                  <div key={card.label} className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm flex items-center gap-6">
                     <div className={`p-5 bg-${card.color}-50 text-${card.color}-600 rounded-2xl`}><card.icon className="w-8 h-8" /></div>
                     <div><p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{card.label}</p><p className="text-3xl font-black">{card.val}</p></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-[#8B5E3C]"><History className="w-5 h-5" /> Operational Audit</h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {logs.map(log => (
                      <div key={log.id} className="flex gap-5 p-5 hover:bg-stone-50 rounded-2xl transition-all border border-transparent hover:border-stone-100">
                        <div className="text-[10px] text-stone-300 font-black whitespace-nowrap pt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-stone-800">{log.userName}</p>
                          <p className="text-xs text-stone-400 leading-relaxed mt-1 font-medium">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#4A3728] p-10 rounded-[40px] text-white shadow-2xl flex flex-col justify-between">
                   <div>
                     <h3 className="text-2xl font-black mb-4">Offline Priority</h3>
                     <p className="text-stone-300 font-medium text-sm leading-relaxed max-w-xs">Data is synchronized locally. Regular database exports are recommended for redundant property security.</p>
                   </div>
                   <div className="flex gap-10 mt-12">
                     <div><p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Total Registry</p><p className="text-4xl font-black">{guests.length}</p></div>
                     <div><p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Lifetime Value</p><p className="text-4xl font-black">₱{payments.reduce((s,p)=>s+p.amount, 0).toLocaleString()}</p></div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="relative w-full max-w-md"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" /><input type="text" placeholder="Search Reservations..." className="w-full pl-16 pr-6 py-5 rounded-[28px] bg-white border border-stone-100 outline-none shadow-sm focus:ring-2 focus:ring-[#D4A373] transition-all" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} /></div>
                <div className="flex gap-3">
                  <button onClick={() => openBookingModal(undefined, undefined, true)} className="bg-[#8B5E3C] text-white px-6 py-4 rounded-[28px] font-black shadow-xl hover:bg-[#A67C52] transition-colors flex items-center gap-2">Walk-In</button>
                  <button onClick={() => openBookingModal(undefined, undefined, false)} className="bg-[#4A3728] text-white px-8 py-4 rounded-[28px] font-black shadow-xl hover:bg-[#8B5E3C] transition-colors">Reservation</button>
                </div>
              </div>
              <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-[10px] font-black uppercase text-stone-400 border-b border-stone-100"><tr className="tracking-widest"><th className="px-10 py-6">Guest Profile</th><th className="px-10 py-6">Stay Dates</th><th className="px-10 py-6">Unit</th><th className="px-10 py-6">Status</th><th className="px-10 py-6 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-stone-50">
                    {bookings.filter(b => b.id.includes(bookingSearch) || guests.find(g => g.id === b.guestId)?.name.toLowerCase().includes(bookingSearch.toLowerCase())).map(b => (
                      <tr key={b.id} className="hover:bg-stone-50/50 transition-all">
                        <td className="px-10 py-7 font-black text-lg">{guests.find(g => g.id === b.guestId)?.name}</td>
                        <td className="px-10 py-7 text-sm text-stone-500 font-bold">{b.checkIn} → {b.checkOut}</td>
                        <td className="px-10 py-7 font-black text-[#8B5E3C]">Unit {rooms.find(r => r.id === b.roomId)?.number}</td>
                        <td className="px-10 py-7">
                           <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${b.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>{b.status.replace('_',' ')}</span>
                        </td>
                        <td className="px-10 py-7 text-right flex justify-end gap-3">
                          <button onClick={() => { setSelectedBookingForReceipt(b); setIsReceiptModalOpen(true); }} className="p-3.5 hover:bg-stone-100 rounded-2xl text-stone-400 transition-colors"><Printer className="w-5 h-5" /></button>
                          {b.status === 'PENDING' && <button onClick={() => { 
                             const bk = bookings.map(x => x.id === b.id ? {...x, status: 'CHECKED_IN' as any} : x);
                             const rm = rooms.map(x => x.id === b.roomId ? {...x, status: RoomStatus.OCCUPIED} : x);
                             setBookings(bk); db.saveBookings(bk); setRooms(rm); db.saveRooms(rm);
                             createLog('CHECK_IN', 'BOOKING', b.id, `Manual check-in for ${guests.find(g => g.id === b.guestId)?.name}.`);
                          }} className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all"><UserCheck className="w-5 h-5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm flex flex-wrap justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                     <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }} className="p-3 hover:bg-stone-50 rounded-xl transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                     <h2 className="text-xl font-black min-w-[240px] text-center">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                     <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }} className="p-3 hover:bg-stone-50 rounded-xl transition-colors"><ChevronRight className="w-6 h-6" /></button>
                  </div>
                  <div className="flex bg-stone-100 p-1 rounded-2xl">
                     {['month', 'day'].map(v => (
                       <button key={v} onClick={() => setCalendarView(v as any)} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${calendarView === v ? 'bg-[#4A3728] text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>{v}</button>
                     ))}
                  </div>
               </div>
               {calendarView === 'month' ? (
                <div className="grid grid-cols-7 gap-px bg-stone-100 rounded-[40px] overflow-hidden border border-stone-100 shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="bg-stone-50 p-6 text-center text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">{d}</div>
                    ))}
                    {(() => {
                      const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                      const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="bg-white/50 h-36" />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dayStr = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d));
                        const busyCount = bookings.filter(b => dayStr >= b.checkIn && dayStr < b.checkOut).length;
                        cells.push(
                          <div key={d} className="bg-white h-36 p-5 flex flex-col justify-between border-[0.5px] border-stone-50 group hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => { const nd = new Date(calendarDate); nd.setDate(d); setCalendarDate(nd); setCalendarView('day'); }}>
                            <span className="text-sm font-black text-stone-300 group-hover:text-[#D4A373] transition-colors">{d}</span>
                            {busyCount > 0 && (
                              <div className="space-y-2">
                                 <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#8B5E3C]" style={{ width: `${Math.min((busyCount/28)*100, 100)}%` }} />
                                 </div>
                                 <p className="text-[9px] font-black text-[#8B5E3C] tracking-widest uppercase">{busyCount} Reserved</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                </div>
               ) : (
                <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-50">
                   {rooms.map(room => {
                     const ds = formatDate(calendarDate);
                     const currentBooking = bookings.find(b => ds >= b.checkIn && ds < b.checkOut && b.roomId === room.id);
                     return (
                       <div key={room.id} className="p-8 flex items-center justify-between group hover:bg-stone-50 transition-colors">
                          <div className="flex items-center gap-10">
                             <div className={`w-16 h-16 rounded-[24px] flex flex-col items-center justify-center font-black ${currentBooking ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <span className="text-[10px] opacity-40 leading-none">UNIT</span>
                                <span className="text-xl">{room.number}</span>
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest mb-1">{room.type} Wing</p>
                                <p className="font-bold text-lg">{currentBooking ? guests.find(g => g.id === currentBooking.guestId)?.name : 'Vacant & Available'}</p>
                             </div>
                          </div>
                          {!currentBooking ? (
                            <div className="flex gap-2">
                              <button onClick={() => openBookingModal(room.id, ds, true)} className="bg-[#8B5E3C] text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                <Zap className="w-4 h-4 text-amber-300" /> Walk-In
                              </button>
                              <button onClick={() => openBookingModal(room.id, ds, false)} className="bg-[#4A3728] text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                <Plus className="w-4 h-4" /> Book Unit
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black uppercase bg-stone-100 px-4 py-2 rounded-xl text-stone-400 tracking-widest">Reserved</span>
                          )}
                       </div>
                     );
                   })}
                </div>
               )}
            </div>
          )}

          {activeTab === 'housekeeping' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 animate-in fade-in">
               {rooms.filter(r => r.status === RoomStatus.CLEANING || r.status === RoomStatus.AVAILABLE).map(r => (
                 <div key={r.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between gap-5 transition-transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start">
                       <div>
                         <p className="text-lg font-black">Unit {r.number}</p>
                         <p className="text-[7px] text-stone-400 font-black uppercase tracking-widest mt-0.5">{r.type}</p>
                       </div>
                       <Brush className={`w-5 h-5 ${r.status === RoomStatus.CLEANING ? 'text-red-400' : 'text-emerald-500'}`} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => { const u = rooms.map(x => x.id === r.id ? {...x, status: RoomStatus.CLEANING} : x); setRooms(u); db.saveRooms(u); createLog('EDIT', 'ROOM', r.id.toString(), `Unit ${r.number} flagged for cleaning.`); }} className={`w-full py-2.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${r.status === RoomStatus.CLEANING ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'}`}>Dirty</button>
                       <button onClick={() => { const u = rooms.map(x => x.id === r.id ? {...x, status: RoomStatus.AVAILABLE} : x); setRooms(u); db.saveRooms(u); createLog('EDIT', 'ROOM', r.id.toString(), `Unit ${r.number} verified as clean.`); }} className={`w-full py-2.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${r.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'}`}>Ready</button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Property Inventory</h3><p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">28 Physical Units</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                {rooms.map(r => (
                  <div key={r.id} onClick={() => { setEditingRoom(r); setIsRoomEditModalOpen(true); }} className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all hover:scale-105 shadow-sm flex flex-col justify-between h-52 group ${
                    r.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    r.status === RoomStatus.OCCUPIED ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-stone-50 text-stone-400 border-stone-200'
                  }`}>
                    <div className="flex justify-between items-start"><span className="text-4xl font-black group-hover:scale-110 transition-transform">#{r.number}</span><Settings className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">{r.status}</p>
                      <p className="text-xl font-black">₱{r.baseRate.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="relative max-w-md"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" /><input type="text" placeholder="Search Guest History..." className="w-full pl-16 pr-8 py-5 rounded-[28px] bg-white border border-stone-100 shadow-sm outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={guestSearch} onChange={e => setGuestSearch(e.target.value)} /></div>
               <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-stone-50 text-[10px] font-black uppercase text-stone-300 border-b border-stone-100 tracking-widest"><tr className="px-10 py-6"><th className="px-10 py-6">Member Information</th><th className="px-10 py-6">Contact</th><th className="px-10 py-6">Registry ID</th><th className="px-10 py-6 text-right">Actions</th></tr></thead>
                     <tbody className="divide-y divide-stone-50">
                        {guests.filter(g => g.name.toLowerCase().includes(guestSearch.toLowerCase())).map(g => (
                           <tr key={g.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-10 py-7 font-black text-lg">{g.name}</td>
                              <td className="px-10 py-7 text-sm font-bold text-stone-500">{g.phone} <br/><span className="text-xs font-medium text-stone-400">{g.email}</span></td>
                              <td className="px-10 py-7 font-black text-[#D4A373] tracking-tighter text-sm uppercase">{g.id}</td>
                              <td className="px-10 py-7 text-right"><button className="px-6 py-2.5 bg-[#4A3728] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#8B5E3C] transition-colors shadow-lg">View Profile</button></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'financials' && canAccessFull && (
            <div className="space-y-12 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-[450px]">
                  <div className="bg-white rounded-[48px] p-12 border border-stone-100 shadow-sm flex flex-col">
                     <h3 className="text-xl font-black mb-10">Property Revenue Trend</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{n:'Mon',v:45000},{n:'Tue',v:52000},{n:'Wed',v:38000},{n:'Thu',v:61000},{n:'Fri',v:89000},{n:'Sat',v:124000},{n:'Sun',v:105000}]}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                           <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold', fill:'#999'}} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold', fill:'#999'}} />
                           <Tooltip contentStyle={{borderRadius:'24px', border:'none', boxShadow:'0 15px 30px -10px rgb(0 0 0 / 0.1)'}} />
                           <Bar dataKey="v" fill="#4A3728" radius={[12,12,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="bg-[#4A3728] rounded-[48px] p-16 text-white shadow-2xl flex flex-col justify-between">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Total Ledger Balance</p>
                        <h4 className="text-6xl font-black">₱{payments.reduce((s,p)=>s+p.amount,0).toLocaleString()}</h4>
                     </div>
                     <div className="flex items-center justify-between border-t border-white/10 pt-12">
                        <div><p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Average Occupancy</p><p className="text-3xl font-black">84%</p></div>
                        <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/10 shadow-lg"><BarChart3 className="w-10 h-10 text-[#D4A373]" /></div>
                     </div>
                  </div>
               </div>
               <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-stone-50 flex justify-between items-center"><h3 className="text-xl font-black">Cashflow Registry</h3><button className="text-[10px] font-black uppercase text-[#D4A373] tracking-widest hover:text-[#8B5E3C] transition-colors flex items-center gap-2"><Download className="w-4 h-4" /> Export Ledger</button></div>
                  <table className="w-full text-left">
                     <thead className="bg-stone-50 text-[10px] font-black uppercase text-stone-300 border-b border-stone-100 tracking-widest"><tr className="px-10 py-6"><th className="px-10 py-6">ID</th><th className="px-10 py-6">Method</th><th className="px-10 py-6">Date</th><th className="px-10 py-6 text-right">Settlement</th></tr></thead>
                     <tbody className="divide-y divide-stone-50">
                        {payments.map(p => (
                           <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-10 py-7 font-black text-stone-200 tracking-tighter uppercase text-xs">{p.id}</td>
                              <td className="px-10 py-7"><span className="px-3 py-1 bg-stone-100 rounded-lg text-[10px] font-black text-stone-600 uppercase tracking-widest">{p.method}</span></td>
                              <td className="px-10 py-7 text-sm font-bold text-stone-400">{p.date}</td>
                              <td className="px-10 py-7 text-right font-black text-lg">₱{p.amount.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'team' && canAccessFull && (
            <div className="space-y-12 animate-in fade-in">
              <div className="flex justify-between items-center"><h3 className="text-3xl font-black">Property Team</h3><button onClick={() => { setEditingUser({ role: UserRole.STAFF, isActive: true }); setIsUserModalOpen(true); }} className="bg-[#4A3728] text-white px-10 py-5 rounded-[28px] font-black shadow-xl flex items-center gap-4 transition-transform active:scale-95"><Plus className="w-6 h-6" /> Register Staff</button></div>
              <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-[10px] font-black uppercase text-stone-300 border-b border-stone-100 tracking-widest"><tr className="px-10 py-6"><th className="px-10 py-6">Personnel</th><th className="px-10 py-6">Authorization</th><th className="px-10 py-6">Status</th><th className="px-10 py-6 text-right">Config</th></tr></thead>
                  <tbody className="divide-y divide-stone-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-10 py-7 flex items-center gap-6">
                           <div className="w-14 h-14 rounded-2xl bg-[#D4A373]/20 flex items-center justify-center font-black text-[#8B5E3C] text-2xl">{u.name[0]}</div>
                           <p className="font-black text-xl">{u.name}</p>
                        </td>
                        <td className="px-10 py-7"><p className="text-xs font-black text-stone-500 tracking-widest lowercase">@{u.username}</p><span className="text-[10px] font-black uppercase text-[#D4A373] tracking-widest">{u.role}</span></td>
                        <td className="px-10 py-7"><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{u.isActive ? 'Active Duty' : 'Locked'}</span></td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-3.5 hover:bg-stone-100 rounded-2xl text-stone-300 hover:text-[#8B5E3C] transition-all"><Settings className="w-5 h-5" /></button>
                            <button onClick={() => { if(confirm("Terminate this staff record?")) { const upd = users.filter(x => x.id !== u.id); setUsers(upd); db.saveUsers(upd); createLog('DELETE', 'USER', u.id, `Staff registry ${u.name} deleted.`); }}} className="p-3.5 hover:bg-red-50 rounded-2xl text-red-300 hover:text-red-600 transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && canAccessFull && (
            <div className="space-y-12 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="bg-white p-12 rounded-[56px] border border-stone-100 shadow-sm space-y-10">
                    <h3 className="text-2xl font-black">Property Config</h3>
                    <div className="space-y-6">
                       <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] ml-2">Operating Name</label><input type="text" className="w-full px-8 py-5 rounded-3xl bg-stone-50 font-black text-xl outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={hotelSettings.name} onChange={e => setHotelSettings({...hotelSettings, name: e.target.value})} /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] ml-2">Operating Currency</label><input type="text" className="w-full px-8 py-5 rounded-3xl bg-stone-50 font-black text-xl outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={hotelSettings.currency} onChange={e => setHotelSettings({...hotelSettings, currency: e.target.value})} /></div>
                    </div>
                    <button onClick={() => { db.saveSettings(hotelSettings); alert('Property Config Updated.'); }} className="w-full py-6 bg-[#4A3728] text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-[#8B5E3C] transition-all flex items-center justify-center gap-4"><Save className="w-6 h-6" /> Save Settings</button>
                 </div>
                 <div className="bg-[#4A3728] p-16 rounded-[56px] text-white shadow-2xl flex flex-col justify-between">
                    <div>
                       <h3 className="text-3xl font-black mb-8">Data Master</h3>
                       <p className="text-stone-300 text-sm font-medium leading-relaxed mb-12">Download your property's entire history. This creates a secure JSON file containing all stays, guest registries, and financial logs.</p>
                       <div className="flex flex-wrap gap-4">
                          <button onClick={() => {
                             const data = { rooms, bookings, guests, payments, users, logs, settings: hotelSettings, exportedAt: new Date().toISOString() };
                             const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                             const url = URL.createObjectURL(blob);
                             const link = document.createElement('a');
                             link.href = url; link.download = `hus_hotel_db_dump_${formatDate(new Date())}.json`;
                             link.click();
                          }} className="px-10 py-5 bg-white/10 rounded-[28px] font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3"><Download className="w-5 h-5" /> Export Ledger</button>
                          <button onClick={() => { if(confirm("Wipe all property data? This cannot be undone.")) { localStorage.clear(); window.location.reload(); }}} className="px-10 py-5 bg-red-900/30 text-red-100 rounded-[28px] font-black text-xs uppercase tracking-widest border border-red-700/50 hover:bg-red-800 transition-all flex items-center gap-3"><AlertTriangle className="w-5 h-5" /> Factory Reset</button>
                       </div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.5em] mt-20 text-center">Hǔs Enterprise v3.8.0-Alpha</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/80 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-6xl rounded-[64px] shadow-2xl overflow-hidden flex h-[800px] animate-in slide-in-from-bottom-12">
              <div className="w-96 bg-stone-50 p-16 border-r border-stone-100 flex flex-col justify-between">
                 <div>
                   <HusLogo className="mb-20 scale-125 origin-left" />
                   <h3 className="text-5xl font-black text-[#4A3728] leading-tight">
                    {bookingForm.isWalkIn ? "Walk-In Stay" : "Stay Reservation"}
                   </h3>
                   {bookingForm.isWalkIn && (
                     <div className="mt-4 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                       <WalkInIcon className="w-3 h-3" /> Priority Check-In
                     </div>
                   )}
                 </div>
                 <div className="p-10 bg-white rounded-[40px] border border-stone-100 shadow-sm"><p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-3">Inventory Available</p><p className="text-5xl font-black text-[#D4A373]">{stats.ready}<span className="text-sm font-black text-stone-300 ml-3">UNITS</span></p></div>
              </div>
              <div className="flex-1 p-20 overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-center mb-16"><h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Entry Manifest</h4><button onClick={() => setBookingModalOpen(false)} className="p-5 hover:bg-stone-50 rounded-full transition-all"><X className="w-8 h-8" /></button></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div className="space-y-16">
                       <section className="space-y-8">
                          <h5 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] flex items-center gap-4"><Calendar className="w-5 h-5" /> 1. Logistics</h5>
                          <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-2"><label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-3">Arrive</label><input type="date" disabled={bookingForm.isWalkIn} className={`w-full p-5 rounded-2xl bg-stone-50 font-black outline-none border border-transparent focus:border-stone-200 ${bookingForm.isWalkIn ? 'opacity-50' : ''}`} value={bookingForm.checkIn} onChange={e => setBookingForm({...bookingForm, checkIn: e.target.value})} /></div>
                             <div className="space-y-2"><label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-3">Depart</label><input type="date" className="w-full p-5 rounded-2xl bg-stone-50 font-black outline-none border border-transparent focus:border-stone-200" value={bookingForm.checkOut} onChange={e => setBookingForm({...bookingForm, checkOut: e.target.value})} /></div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 p-6 bg-stone-50 rounded-[32px] border border-stone-100 shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                             {rooms.filter(r => r.status === RoomStatus.AVAILABLE).map(r => (
                                <button key={r.id} onClick={() => setBookingForm({...bookingForm, selectedRoomId: r.id})} className={`p-4 rounded-2xl text-xs font-black transition-all ${bookingForm.selectedRoomId === r.id ? 'bg-[#4A3728] text-white shadow-xl scale-110' : 'bg-white text-stone-400 border border-stone-100 hover:border-stone-200'}`}>#{r.number}</button>
                             ))}
                          </div>
                       </section>
                       <section className="space-y-8">
                          <h5 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] flex items-center gap-4"><MessageSquare className="w-5 h-5" /> 2. Special Notes</h5>
                          <textarea placeholder="Instruction for operations or housekeeping..." className="w-full h-40 p-8 rounded-[32px] bg-stone-50 font-medium outline-none border border-transparent focus:border-stone-200 shadow-inner resize-none" value={bookingForm.specialRequests} onChange={e => setBookingForm({...bookingForm, specialRequests: e.target.value})} />
                       </section>
                    </div>
                    <div className="space-y-16"> 
                       <section className="space-y-8">
                          <h5 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] flex items-center gap-4"><Users className="w-5 h-5" /> 3. Guest Profile</h5>
                          <div className="space-y-5">
                             <input type="text" placeholder="Full Registry Name" className="w-full p-6 rounded-2xl bg-stone-50 font-black text-lg outline-none border border-transparent focus:border-stone-200" value={bookingForm.guestName} onChange={e => setBookingForm({...bookingForm, guestName: e.target.value})} />
                             <input type="text" placeholder="Mobile Contact" className="w-full p-6 rounded-2xl bg-stone-50 font-black text-lg outline-none border border-transparent focus:border-stone-200" value={bookingForm.guestPhone} onChange={e => setBookingForm({...bookingForm, guestPhone: e.target.value})} />
                             <input type="text" placeholder="ID Number / Passport (Optional)" className="w-full p-6 rounded-2xl bg-stone-50 font-black text-sm outline-none border border-transparent focus:border-stone-200" value={bookingForm.guestIdNum} onChange={e => setBookingForm({...bookingForm, guestIdNum: e.target.value})} />
                          </div>
                       </section>
                       <section className="space-y-8">
                          <h5 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] flex items-center gap-4"><CreditCard className="w-5 h-5" /> 4. Settlement</h5>
                          <div className="grid grid-cols-2 gap-8">
                             <select className="p-6 rounded-2xl bg-stone-50 font-black outline-none text-xs uppercase tracking-widest border border-transparent focus:border-stone-200" value={bookingForm.paymentMethod} onChange={e => setBookingForm({...bookingForm, paymentMethod: e.target.value as PaymentMethod})}><option value={PaymentMethod.CASH}>Cash</option><option value={PaymentMethod.GCASH}>GCash Pay</option><option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option></select>
                             <input type="number" placeholder="Downpayment" className="p-6 rounded-2xl bg-emerald-50 text-emerald-700 font-black outline-none border border-emerald-100 shadow-inner" value={bookingForm.initialPayment || ''} onChange={e => setBookingForm({...bookingForm, initialPayment: Number(e.target.value)})} />
                          </div>
                       </section>
                       <button onClick={handleCreateBooking} disabled={!bookingForm.selectedRoomId} className={`w-full py-10 rounded-[48px] font-black text-3xl shadow-2xl transition-all transform active:scale-95 mt-10 ${!bookingForm.selectedRoomId ? 'bg-stone-100 text-stone-300' : 'bg-[#4A3728] text-white hover:bg-[#8B5E3C]'}`}>
                        {bookingForm.isWalkIn ? "Execute Walk-In" : "Confirm Stay"}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Unit Master Edit Modal */}
      {isRoomEditModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl p-12 space-y-10 animate-in zoom-in">
              <div className="flex justify-between items-center"><h3 className="text-3xl font-black">Unit Master</h3><button onClick={() => setIsRoomEditModalOpen(false)} className="p-3 hover:bg-stone-50 rounded-full transition-all"><X className="w-6 h-6" /></button></div>
              <div className="space-y-6">
                 {isSuperAdmin && (
                   <>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-3">Unit Number</label>
                        <input type="text" className="w-full p-5 rounded-2xl bg-stone-50 font-black text-xl outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={editingRoom.number || ''} onChange={e => setEditingRoom({...editingRoom, number: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-3">Unit Category</label>
                        <select className="w-full p-5 rounded-2xl bg-stone-50 font-black outline-none text-xs uppercase tracking-widest" value={editingRoom.type} onChange={e => setEditingRoom({...editingRoom, type: e.target.value as RoomType})}>
                           <option value={RoomType.STANDARD}>Standard Wing</option>
                           <option value={RoomType.DELUXE}>Deluxe Wing</option>
                           <option value={RoomType.SUITE}>Premium Suite</option>
                        </select>
                     </div>
                   </>
                 )}
                 <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-3">Nightly Stay Rate</label><input type="number" className="w-full p-5 rounded-2xl bg-stone-50 font-black text-2xl outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={editingRoom.baseRate} onChange={e => setEditingRoom({...editingRoom, baseRate: Number(e.target.value)})} /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-3">Operating Status</label>
                    <select className="w-full p-5 rounded-2xl bg-stone-50 font-black outline-none text-xs uppercase tracking-widest" value={editingRoom.status} onChange={e => setEditingRoom({...editingRoom, status: e.target.value as RoomStatus})}>
                       <option value={RoomStatus.AVAILABLE}>Available</option><option value={RoomStatus.OCCUPIED}>Occupied</option><option value={RoomStatus.CLEANING}>Cleaning</option><option value={RoomStatus.MAINTENANCE}>Maintenance</option>
                    </select>
                 </div>
                 <button onClick={saveRoomSettings} className="w-full py-6 bg-[#4A3728] text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-[#8B5E3C] transition-all">Commit Master Registry</button>
              </div>
           </div>
        </div>
      )}

      {/* Staff Master Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl p-12 space-y-10 animate-in zoom-in">
              <div className="flex justify-between items-center"><h3 className="text-3xl font-black">Staff Entry</h3><button onClick={() => setIsUserModalOpen(false)} className="p-3 hover:bg-stone-50 rounded-full transition-all"><X className="w-6 h-6" /></button></div>
              <div className="space-y-6">
                 <input type="text" placeholder="Full Registry Name" className="w-full p-6 rounded-2xl bg-stone-50 font-black outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                 <input type="text" placeholder="Username Handle" className="w-full p-6 rounded-2xl bg-stone-50 font-black outline-none focus:ring-2 focus:ring-[#D4A373] transition-all" value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                 <div className="grid grid-cols-2 gap-4">
                    <select className="p-5 rounded-2xl bg-stone-50 font-black outline-none text-xs uppercase tracking-widest" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                       <option value={UserRole.STAFF}>Front Desk</option><option value={UserRole.MANAGER}>Manager</option><option value={UserRole.SUPER_ADMIN}>Admin</option>
                    </select>
                    <select className="p-5 rounded-2xl bg-stone-50 font-black outline-none text-xs uppercase tracking-widest" value={editingUser.isActive ? 'true' : 'false'} onChange={e => setEditingUser({...editingUser, isActive: e.target.value === 'true'})}>
                       <option value="true">Active Duty</option><option value="false">Locked</option>
                    </select>
                 </div>
                 <button onClick={saveUserData} className="w-full py-6 bg-[#4A3728] text-white rounded-[32px] font-black text-xl shadow-xl hover:bg-[#8B5E3C] transition-all">Apply Personnel Entry</button>
              </div>
           </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && selectedBookingForReceipt && (
        <div className="fixed inset-0 z-[200] bg-stone-900/95 backdrop-blur-2xl flex items-center justify-center p-4">
           <div className="receipt-container bg-white w-full max-w-3xl rounded-[64px] shadow-2xl p-16 space-y-12 no-print animate-in zoom-in">
              <div className="flex justify-between items-start">
                 <HusLogo className="scale-110 origin-left" />
                 <div className="text-right">
                    <h5 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em] mb-3">Folio / Receipt</h5>
                    <p className="text-sm font-black text-[#8B5E3C]">REF: {selectedBookingForReceipt.id}</p>
                    <p className="text-sm font-bold text-stone-400 mt-1">{selectedBookingForReceipt.createdAt.split('T')[0]}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-12 border-t border-stone-100 pt-12">
                 <div>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-4">Guest Info</p>
                    <p className="text-2xl font-black">{guests.find(g => g.id === selectedBookingForReceipt.guestId)?.name}</p>
                    <p className="text-sm font-medium text-stone-400 mt-1">{guests.find(g => g.id === selectedBookingForReceipt.guestId)?.phone}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-4">Stay Allocation</p>
                    <p className="text-2xl font-black text-[#8B5E3C]">Unit {rooms.find(r => r.id === selectedBookingForReceipt.roomId)?.number}</p>
                    <p className="text-sm font-bold text-stone-500 mt-1">{selectedBookingForReceipt.checkIn} — {selectedBookingForReceipt.checkOut}</p>
                 </div>
              </div>
              <div className="bg-stone-50 p-12 rounded-[48px] space-y-6">
                 <div className="flex justify-between items-center font-bold text-lg"><span>Reservation Base Total</span><span>₱{selectedBookingForReceipt.totalAmount.toLocaleString()}</span></div>
                 <div className="flex justify-between items-center font-bold text-lg text-emerald-600"><span>Paid Deposits</span><span>- ₱{selectedBookingForReceipt.paidAmount.toLocaleString()}</span></div>
                 <div className="border-t border-stone-200 pt-8 flex justify-between items-center text-4xl font-black"><span>Outstanding</span><span>₱{(selectedBookingForReceipt.totalAmount - selectedBookingForReceipt.paidAmount).toLocaleString()}</span></div>
              </div>
              <div className="flex justify-between items-center gap-6 no-print">
                 <button onClick={() => setIsReceiptModalOpen(false)} className="px-12 py-6 font-black uppercase text-[10px] text-stone-400 hover:bg-stone-50 rounded-[32px] transition-all tracking-widest">Back to PMS</button>
                 <button onClick={() => window.print()} className="bg-[#4A3728] text-white px-12 py-6 rounded-[32px] font-black flex items-center gap-4 shadow-xl hover:bg-[#8B5E3C] transition-all"><Printer className="w-6 h-6" /> Execute Print</button>
              </div>
           </div>
           
           {/* Legacy Print Output */}
           <div className="print-only p-12 space-y-12 text-black bg-white w-full h-full font-serif">
              <div className="flex justify-between items-start">
                 <div className="flex flex-col"><span className="text-5xl font-bold italic tracking-tighter">Hǔs</span><span className="text-[10px] tracking-[0.5em] font-light mt-1">HOTEL</span></div>
                 <div className="text-right"><h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Guest Folio</h1><p className="text-sm">Invoice No: {selectedBookingForReceipt.id}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-20 py-10 border-t border-b border-black">
                 <div><h4 className="text-[10px] font-bold uppercase mb-2">Guest</h4><p className="text-xl font-bold">{guests.find(g => g.id === selectedBookingForReceipt.guestId)?.name}</p></div>
                 <div><h4 className="text-[10px] font-bold uppercase mb-2">Stay Details</h4><p className="text-lg font-bold">Room {rooms.find(r => r.id === selectedBookingForReceipt.roomId)?.number}</p><p className="text-sm">{selectedBookingForReceipt.checkIn} to {selectedBookingForReceipt.checkOut}</p></div>
              </div>
              <div className="space-y-4 text-right">
                 <div className="flex justify-between font-bold py-2"><span className="uppercase text-[10px]">Grand Total</span><span>₱{selectedBookingForReceipt.totalAmount.toLocaleString()}</span></div>
                 <div className="flex justify-between font-bold py-2"><span className="uppercase text-[10px]">Total Paid</span><span>₱{selectedBookingForReceipt.paidAmount.toLocaleString()}</span></div>
                 <div className="flex justify-between text-3xl font-bold pt-10 border-t border-black"><span className="uppercase text-[10px] mt-4">Balance Due</span><span>₱{(selectedBookingForReceipt.totalAmount - selectedBookingForReceipt.paidAmount).toLocaleString()}</span></div>
              </div>
              <div className="mt-40 pt-10 border-t border-stone-200 text-[10px] uppercase tracking-widest text-center">Thank you for choosing Hus Hotel. Stay again soon.</div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
