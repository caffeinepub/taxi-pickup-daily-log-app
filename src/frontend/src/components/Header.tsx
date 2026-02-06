import { Car, Moon, Sun, LogOut, User, Menu, FileText, Trash2, Edit, FileDown, Activity, Info, Download, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetProfile } from '../hooks/useQueries';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DailyReportDialog from './DailyReportDialog';
import DeleteAllRecordsDialog from './DeleteAllRecordsDialog';
import EditDeleteRecordDialog from './EditDeleteRecordDialog';
import GeneratePDFDialog from './GeneratePDFDialog';
import CycleBalanceDialog from './CycleBalanceDialog';
import AboutDialog from './AboutDialog';
import ExportImportDialog from './ExportImportDialog';
import EditProfileDialog from './EditProfileDialog';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const { clear, identity } = useInternetIdentity();
    const { data: profile } = useGetProfile();
    const queryClient = useQueryClient();
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDeleteDialog, setShowEditDeleteDialog] = useState(false);
    const [showPDFDialog, setShowPDFDialog] = useState(false);
    const [showCycleBalanceDialog, setShowCycleBalanceDialog] = useState(false);
    const [showAboutDialog, setShowAboutDialog] = useState(false);
    const [showExportImportDialog, setShowExportImportDialog] = useState(false);
    const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

    const handleLogout = async () => {
        queryClient.clear();
        await clear();
    };

    return (
        <>
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Car className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Taxi Daily Log</h1>
                                <p className="text-sm text-muted-foreground">Track your pickups</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {identity && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="h-5 w-5" />
                                            <span className="sr-only">Menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => setShowDailyReport(true)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>Daily Report</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowEditDeleteDialog(true)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit/Delete Record</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowPDFDialog(true)}>
                                            <FileDown className="mr-2 h-4 w-4" />
                                            <span>Generate PDF Report</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowCycleBalanceDialog(true)}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span>Cycle Balance</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowExportImportDialog(true)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            <span>Export/Import Data</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowEditProfileDialog(true)}>
                                            <UserCog className="mr-2 h-4 w-4" />
                                            <span>Edit Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete All Records</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowAboutDialog(true)}>
                                            <Info className="mr-2 h-4 w-4" />
                                            <span>About</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}>
                                            <img 
                                                src="/assets/generated/logout-icon-transparent.dim_32x32.png" 
                                                alt="Logout" 
                                                className="w-4 h-4 mr-2"
                                            />
                                            <span>Log Out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {identity && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <User className="h-5 w-5" />
                                            <span className="sr-only">User menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {profile?.driverName || 'Driver'}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {profile?.contactInfo || ''}
                                                </p>
                                                {profile?.email && (
                                                    <p className="text-xs leading-none text-muted-foreground">
                                                        {profile.email}
                                                    </p>
                                                )}
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowEditProfileDialog(true)}>
                                            <UserCog className="mr-2 h-4 w-4" />
                                            <span>Edit Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log Out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            <DailyReportDialog open={showDailyReport} onOpenChange={setShowDailyReport} />
            <EditDeleteRecordDialog open={showEditDeleteDialog} onOpenChange={setShowEditDeleteDialog} />
            <DeleteAllRecordsDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
            <GeneratePDFDialog open={showPDFDialog} onOpenChange={setShowPDFDialog} />
            <CycleBalanceDialog open={showCycleBalanceDialog} onOpenChange={setShowCycleBalanceDialog} />
            <ExportImportDialog open={showExportImportDialog} onOpenChange={setShowExportImportDialog} />
            <AboutDialog open={showAboutDialog} onOpenChange={setShowAboutDialog} />
            <EditProfileDialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog} />
        </>
    );
}
