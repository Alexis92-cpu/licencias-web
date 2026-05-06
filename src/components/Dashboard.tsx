import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { encryptData, decryptData } from '../lib/encryption';
import { LogOut, Plus, Search, Edit2, Trash2, Printer, ShieldCheck, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Cliente {
  id: number;
  pedido: string;
  nombre: string;
  telefono: string;
  email: string;
  licencias: Licencia[];
}

interface Licencia {
  id: number;
  tipo: string;
  detalle: string;
}

export const Dashboard = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [previewClient, setPreviewClient] = useState<Cliente | null>(null);

  // Form State
  const [pedido, setPedido] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [hasWindows, setHasWindows] = useState(false);
  const [windowsDetalle, setWindowsDetalle] = useState('');
  const [hasOffice, setHasOffice] = useState(false);
  const [officeDetalle, setOfficeDetalle] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    setLoading(true);
    // In a real app, this would query Supabase.
    // Assuming tables: clientes (id, pedido, nombre, telefono, email)
    // and licencias (id, cliente_id, tipo, detalle_encrypted)
    const { data: clientesData, error: errC } = await supabase.from('clientes').select('*').order('id', { ascending: false });
    const { data: licenciasData, error: errL } = await supabase.from('licencias').select('*');

    if (!errC && !errL && clientesData) {
      // Decrypt licenses
      const decryptedLicencias = await Promise.all((licenciasData || []).map(async (l) => ({
        ...l,
        detalle: await decryptData(l.detalle)
      })));

      const formatted = clientesData.map(c => ({
        ...c,
        licencias: decryptedLicencias.filter(l => l.cliente_id === c.id)
      }));
      setClientes(formatted);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingClient(cliente);
      setPedido(cliente.pedido || '');
      setNombre(cliente.nombre || '');
      setTelefono(cliente.telefono || '');
      setEmail(cliente.email || '');
      
      const win = cliente.licencias.find(l => l.tipo === 'Windows');
      const off = cliente.licencias.find(l => l.tipo === 'Office');
      
      setHasWindows(!!win);
      setWindowsDetalle(win?.detalle || '');
      setHasOffice(!!off);
      setOfficeDetalle(off?.detalle || '');
    } else {
      setEditingClient(null);
      setPedido('');
      setNombre('');
      setTelefono('');
      setEmail('');
      setHasWindows(false);
      setWindowsDetalle('');
      setHasOffice(false);
      setOfficeDetalle('');
    }
    setModalOpen(true);
  };

  const saveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim().length < 3) return alert('El nombre debe tener al menos 3 caracteres.');

    try {
      let clienteId = editingClient?.id;

      if (editingClient) {
        // Update client
        await supabase.from('clientes').update({ pedido, nombre, telefono, email }).eq('id', clienteId);
        // Remove old licenses to insert new ones
        await supabase.from('licencias').delete().eq('cliente_id', clienteId);
      } else {
        // Insert client
        const { data, error } = await supabase.from('clientes').insert([{ pedido, nombre, telefono, email }]).select();
        if (error) throw error;
        if (data && data.length > 0) clienteId = data[0].id;
      }

      // Insert licenses securely encrypted
      if (clienteId) {
        const licsToInsert = [];
        if (hasWindows) {
          licsToInsert.push({ cliente_id: clienteId, tipo: 'Windows', detalle: await encryptData(windowsDetalle) });
        }
        if (hasOffice) {
          licsToInsert.push({ cliente_id: clienteId, tipo: 'Office', detalle: await encryptData(officeDetalle) });
        }
        if (licsToInsert.length > 0) {
          await supabase.from('licencias').insert(licsToInsert);
        }
      }

      setModalOpen(false);
      fetchClientes();
    } catch (err) {
      alert('Error al guardar: ' + (err as Error).message);
    }
  };

  const deleteCliente = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este cliente y todas sus licencias?')) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClientes();
    }
  };

  const printCliente = (cliente: Cliente) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Licencias de ${cliente.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
              h1 { color: #2563eb; }
              .details { margin-top: 20px; font-size: 16px; }
              .license { background: #f3f4f6; padding: 10px; margin-top: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Detalle de Licencias</h1>
            <div class="details">
              <p><strong>Cliente:</strong> ${cliente.nombre}</p>
              <p><strong>Pedido:</strong> ${cliente.pedido || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}</p>
              <p><strong>Email:</strong> ${cliente.email || 'N/A'}</p>
            </div>
            <h2>Licencias Asignadas</h2>
            ${cliente.licencias.length > 0 ? cliente.licencias.map(l => `
              <div class="license">
                <strong>${l.tipo}:</strong> ${l.detalle}
              </div>
            `).join('') : '<p>Sin licencias registradas.</p>'}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredClientes = clientes.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <ShieldCheck size={28} />
          <span>Gestión Segura de Licencias</span>
        </div>
        <button onClick={handleLogout} className="btn btn-outline">
          <LogOut size={18} /> Salir
        </button>
      </nav>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Directorio de Clientes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Administra las licencias de software con cifrado AES-256-GCM.</p>
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} /> Nuevo Cliente
          </button>
        </div>

        <div className="card">
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Licencias</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos seguros...</td></tr>
                ) : filteredClientes.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron clientes.</td></tr>
                ) : (
                  filteredClientes.map(c => (
                    <tr key={c.id}>
                      <td>{c.pedido || '-'}</td>
                      <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{c.telefono}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {c.licencias.length > 0 ? (
                            c.licencias.map(l => (
                              <span key={l.id} className="badge">
                                {l.tipo}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ninguna</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => setPreviewClient(c)} className="btn btn-outline" style={{ padding: '0.5rem', color: '#2563eb', borderColor: '#bfdbfe' }} title="Vista Previa">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => printCliente(c)} className="btn btn-outline" style={{ padding: '0.5rem' }} title="Imprimir Licencias">
                            <Printer size={16} />
                          </button>
                          <button onClick={() => openModal(c)} className="btn btn-outline" style={{ padding: '0.5rem' }} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteCliente(c.id)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: '#fecaca' }} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {previewClient && (
          <div className="modal-overlay" onClick={() => setPreviewClient(null)}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 style={{ fontSize: '1.25rem' }}>Vista Previa - {previewClient.nombre}</h2>
                <button onClick={() => setPreviewClient(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Pedido:</strong> {previewClient.pedido || 'N/A'}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Teléfono:</strong> {previewClient.telefono || 'N/A'}</p>
                  <p><strong>Email:</strong> {previewClient.email || 'N/A'}</p>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Licencias Asignadas</h3>
                {previewClient.licencias.length > 0 ? previewClient.licencias.map(l => (
                  <div key={l.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{l.tipo}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', wordBreak: 'break-all' }}>{l.detalle}</div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-muted)' }}>No hay licencias registradas.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => printCliente(previewClient)}>
                  <Printer size={16} style={{ marginRight: '0.5rem' }} /> Imprimir
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setPreviewClient(null)}>Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 style={{ fontSize: '1.25rem' }}>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
              </div>
              <form onSubmit={saveCliente}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nombre del Cliente *</label>
                      <input type="text" className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">N° Pedido</label>
                      <input type="text" className="form-input" value={pedido} onChange={e => setPedido(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input type="tel" className="form-input" value={telefono} onChange={e => setTelefono(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Correo Electrónico</label>
                      <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Licencias (Datos Cifrados AES-GCM)</h3>

                  <div className="card" style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                    <label className="checkbox-group">
                      <input type="checkbox" checked={hasWindows} onChange={e => setHasWindows(e.target.checked)} />
                      <span style={{ fontWeight: 500 }}>Licencia Windows</span>
                    </label>
                    {hasWindows && (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ingresa la clave de Windows (Será cifrada)..." 
                        value={windowsDetalle} 
                        onChange={e => setWindowsDetalle(e.target.value)} 
                        style={{ marginTop: '0.5rem' }}
                      />
                    )}
                  </div>

                  <div className="card" style={{ marginBottom: '0', background: 'rgba(0,0,0,0.2)' }}>
                    <label className="checkbox-group">
                      <input type="checkbox" checked={hasOffice} onChange={e => setHasOffice(e.target.checked)} />
                      <span style={{ fontWeight: 500 }}>Licencia Office</span>
                    </label>
                    {hasOffice && (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ingresa la clave de Office (Será cifrada)..." 
                        value={officeDetalle} 
                        onChange={e => setOfficeDetalle(e.target.value)} 
                        style={{ marginTop: '0.5rem' }}
                      />
                    )}
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar Cliente</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
