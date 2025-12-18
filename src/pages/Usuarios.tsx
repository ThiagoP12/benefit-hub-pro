import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/contexts/AuthContext';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  agente_dp: 'Agente de DP',
  colaborador: 'Colaborador',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  gestor: 'bg-warning/10 text-warning border-warning/20',
  agente_dp: 'bg-primary/10 text-primary border-primary/20',
  colaborador: 'bg-muted text-muted-foreground border-border',
};

export default function Usuarios() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'colaborador' as AppRole,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || 'colaborador',
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setFormLoading(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        return;
      }

      // Update the profile with full_name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Update user role if not colaborador (default)
      if (formData.role !== 'colaborador') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Error updating role:', roleError);
          toast.error('Usuário criado, mas erro ao definir permissão');
        }
      }

      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'colaborador' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('Permissão atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      // Delete profile (will cascade to user_roles due to FK)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (profileError) throw profileError;

      // Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (roleError) {
        console.error('Error deleting role:', roleError);
      }

      toast.success('Usuário removido com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao remover usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setFormData({ ...formData, role: user.role });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários e suas permissões no sistema
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Digite o email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Permissão</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: AppRole) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="agente_dp">Agente de DP</SelectItem>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserCog className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleColors[user.role]}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Editar permissão"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          title="Remover usuário"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Permissão</DialogTitle>
              <DialogDescription>
                Altere a permissão do usuário {selectedUser?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Permissão</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AppRole) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="agente_dp">Agente de DP</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateRole} disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o usuário {selectedUser?.full_name}?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
