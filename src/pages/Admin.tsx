import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { awsApi } from "@/services/awsApi";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link2, Link2Off, ShieldCheck, Search } from "lucide-react";

interface UserRecord {
  CustID: string;
  Name: string;
  role: 'user' | 'nurse' | 'admin';
}

interface DependentLink {
  parentCustId: string;
  parentName: string;
  childCustId: string;
  childName: string;
}

const roleBadgeClass = {
  admin: "bg-purple-100 text-purple-800",
  nurse: "bg-blue-100 text-blue-800",
  user: "bg-gray-100 text-gray-700",
};

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [links, setLinks] = useState<DependentLink[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleSearch, setRoleSearch] = useState("");
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // Link dialog state
  const [linkOpen, setLinkOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<UserRecord | null>(null);
  const [selectedChild, setSelectedChild] = useState<UserRecord | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadUsers();
    loadLinks();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const all = await awsApi.getAllUsers();
    setUsers(Array.isArray(all) ? all : []);
    setLoadingUsers(false);
  };

  const loadLinks = async () => {
    const all = await awsApi.getAllLinks();
    setLinks(Array.isArray(all) ? all : []);
  };

  const handleRoleChange = async (custId: string, newRole: 'user' | 'nurse' | 'admin') => {
    setSavingRole(custId);
    try {
      await awsApi.setUserRole(custId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.CustID === custId ? { ...u, role: newRole } : u))
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSavingRole(null);
    }
  };

  const handleLink = async () => {
    if (!selectedParent || !selectedChild) return;
    if (selectedParent.CustID === selectedChild.CustID) {
      toast.error("Parent and child cannot be the same person");
      return;
    }
    setLinking(true);
    try {
      await awsApi.addDependent(selectedParent.CustID, selectedChild.CustID);
      setLinks((prev) => [
        ...prev,
        {
          parentCustId: selectedParent.CustID,
          parentName: selectedParent.Name,
          childCustId: selectedChild.CustID,
          childName: selectedChild.Name,
        },
      ]);
      toast.success(`Linked ${selectedChild.Name} to ${selectedParent.Name}`);
      setLinkOpen(false);
      setSelectedParent(null);
      setSelectedChild(null);
      setParentSearch("");
      setChildSearch("");
    } catch {
      toast.error("Failed to create link");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (link: DependentLink) => {
    try {
      await awsApi.removeDependent(link.parentCustId, link.childCustId);
      setLinks((prev) =>
        prev.filter(
          (l) => !(l.parentCustId === link.parentCustId && l.childCustId === link.childCustId)
        )
      );
      toast.success(`Unlinked ${link.childName} from ${link.parentName}`);
    } catch {
      toast.error("Failed to remove link");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.Name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const parentResults = users.filter(
    (u) =>
      u.Name.toLowerCase().includes(parentSearch.toLowerCase()) &&
      parentSearch.length > 0
  );

  const childResults = users.filter(
    (u) =>
      u.Name.toLowerCase().includes(childSearch.toLowerCase()) &&
      childSearch.length > 0
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user roles and family links</p>
        </div>

        {/* ── User Roles ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={18} /> User Roles
            </CardTitle>
            <div className="relative w-56">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-8 h-8 text-sm"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>CustID</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {[1, 2, 3, 4].map((j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    : filteredUsers.map((u) => (
                        <TableRow key={u.CustID}>
                          <TableCell className="font-medium">{u.Name}</TableCell>
                          <TableCell className="text-xs text-gray-400 font-mono">{u.CustID}</TableCell>
                          <TableCell>
                            <Badge className={roleBadgeClass[u.role]}>{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(val) =>
                                handleRoleChange(u.CustID, val as 'user' | 'nurse' | 'admin')
                              }
                              disabled={savingRole === u.CustID || u.CustID === user?.id}
                            >
                              <SelectTrigger className="w-28 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="nurse">nurse</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {u.CustID === user?.id && (
                              <span className="text-xs text-gray-400 ml-2">you</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Family Links ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Link2 size={18} /> Family Links
            </CardTitle>
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Link2 size={14} className="mr-1" /> Link Parent to Child
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Link a Parent to a Child Account</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Parent search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parent (monitor)</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <Input
                        placeholder="Search by name..."
                        className="pl-8"
                        value={parentSearch}
                        onChange={(e) => {
                          setParentSearch(e.target.value);
                          setSelectedParent(null);
                        }}
                      />
                    </div>
                    {selectedParent ? (
                      <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm">
                        <span className="font-medium">{selectedParent.Name}</span>
                        <button
                          onClick={() => { setSelectedParent(null); setParentSearch(""); }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          clear
                        </button>
                      </div>
                    ) : parentResults.length > 0 ? (
                      <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
                        {parentResults.map((u) => (
                          <button
                            key={u.CustID}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => { setSelectedParent(u); setParentSearch(u.Name); }}
                          >
                            {u.Name}
                            <span className="ml-2 text-xs text-gray-400">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Child search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Child (monitored)</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <Input
                        placeholder="Search by name..."
                        className="pl-8"
                        value={childSearch}
                        onChange={(e) => {
                          setChildSearch(e.target.value);
                          setSelectedChild(null);
                        }}
                      />
                    </div>
                    {selectedChild ? (
                      <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm">
                        <span className="font-medium">{selectedChild.Name}</span>
                        <button
                          onClick={() => { setSelectedChild(null); setChildSearch(""); }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          clear
                        </button>
                      </div>
                    ) : childResults.length > 0 ? (
                      <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
                        {childResults.map((u) => (
                          <button
                            key={u.CustID}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => { setSelectedChild(u); setChildSearch(u.Name); }}
                          >
                            {u.Name}
                            <span className="ml-2 text-xs text-gray-400">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleLink}
                    disabled={!selectedParent || !selectedChild || linking}
                  >
                    {linking ? "Linking..." : "Create Link"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No family links yet. Use the button above to link a parent to a child account.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={`${link.parentCustId}-${link.childCustId}`}>
                        <TableCell className="font-medium">{link.parentName}</TableCell>
                        <TableCell>{link.childName}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleUnlink(link)}
                          >
                            <Link2Off size={14} className="mr-1" /> Unlink
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
