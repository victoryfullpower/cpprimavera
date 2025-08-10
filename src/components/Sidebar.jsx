'use client'
import Link from 'next/link';
import { 
  FiHome, 
  FiUsers, 
  FiChevronDown,
  FiDollarSign,
  FiFileText,
  FiPieChart,
  FiLayers,
  FiCreditCard,
  FiTruck,
  FiBriefcase,
  FiDownload,
  FiUpload,
  FiBarChart2,
  FiHardDrive
} from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import './Sidebar.css';

export default function Sidebar({ userRole }) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('menu-1');
  const submenuRefs = useRef({});
  
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);
  
  const showAdminOptions = ['ADMIN', 'SUPERADMIN'].includes(userRole);
  const showOperacionesOptions = ['ADMIN', 'SUPERADMIN', 'USER'].includes(userRole);
  const showReportes = ['ADMIN', 'SUPERADMIN', 'USER'].includes(userRole);
  const showMantenimiento = ['ADMIN', 'SUPERADMIN', 'USER'].includes(userRole);

  const toggleMenu = (menuId) => {
    if (activeMenu === menuId) {
      const submenu = submenuRefs.current[menuId];
      if (submenu) {
        submenu.style.transition = 'max-height 0.3s ease-out, opacity 0.2s ease-out 0.1s';
        submenu.style.maxHeight = '0';
        submenu.style.opacity = '0';
        
        setTimeout(() => {
          setActiveMenu(null);
        }, 300);
      }
    } else {
      if (activeMenu) {
        const prevSubmenu = submenuRefs.current[activeMenu];
        if (prevSubmenu) {
          prevSubmenu.style.transition = 'max-height 0.3s ease-out, opacity 0.2s ease-out';
          prevSubmenu.style.maxHeight = '0';
          prevSubmenu.style.opacity = '0';
        }
      }
      
      setTimeout(() => {
        setActiveMenu(menuId);
        const newSubmenu = submenuRefs.current[menuId];
        if (newSubmenu) {
          newSubmenu.style.display = 'block';
          void newSubmenu.offsetHeight;
          
          newSubmenu.style.transition = 'max-height 0.4s ease-in-out, opacity 0.3s ease-in';
          newSubmenu.style.maxHeight = `${newSubmenu.scrollHeight}px`;
          newSubmenu.style.opacity = '1';
        }
      }, activeMenu ? 300 : 0);
    }
  };

  useEffect(() => {
    if (activeMenu && submenuRefs.current[activeMenu]) {
      const submenu = submenuRefs.current[activeMenu];
      submenu.style.maxHeight = `${submenu.scrollHeight}px`;
      submenu.style.opacity = '1';
    }
  }, [activeMenu]);

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">
          <i className="fas fa-cube mr-2"></i>
          CCPrimavera
        </h1>
      </div>
      
      <div className="sidebar-content">
        {/* Menú Dashboard */}
        <div className="menu-group">
          <div 
            className="menu-label" 
            onClick={() => toggleMenu('menu-1')}
          >
            <div className="menu-label-content">
              <FiHome className="menu-icon" />
              <span className="menu-text">Inicio</span>
            </div>
            <FiChevronDown className={`menu-arrow ${activeMenu === 'menu-1' ? 'rotated' : ''}`} />
          </div>
          <div 
            ref={el => submenuRefs.current['menu-1'] = el}
            className={`submenu ${activeMenu === 'menu-1' ? 'expanded' : ''}`}
          >
            <Link href="/dashboard/cliente" className={`submenu-item ${isActive('/dashboard/cliente') ? 'active' : ''}`}>
              <FiUsers className="inline mr-2" /> Cliente
            </Link>
            <Link href="/dashboard/stand" className={`submenu-item ${isActive('/dashboard/stand') ? 'active' : ''}`}>
              <FiLayers className="inline mr-2" /> Stands
            </Link>
            {showAdminOptions && (
              <Link href="/dashboard/users" className={`submenu-item ${isActive('/dashboard/users') ? 'active' : ''}`}>
                <FiUsers className="inline mr-2" /> Usuarios
              </Link>
            )}
          </div>
        </div>

        {/* Menú Operaciones */}
        {showOperacionesOptions && (
          <div className="menu-group">
            <div 
              className="menu-label" 
              onClick={() => toggleMenu('menu-2')}
            >
              <div className="menu-label-content">
                <FiDollarSign className="menu-icon" />
                <span className="menu-text">Operaciones</span>
              </div>
              <FiChevronDown className={`menu-arrow ${activeMenu === 'menu-2' ? 'rotated' : ''}`} />
            </div>
            <div 
              ref={el => submenuRefs.current['menu-2'] = el}
              className={`submenu ${activeMenu === 'menu-2' ? 'expanded' : ''}`}
            >
              <Link href="/dashboard/conceptos-deuda" className={`submenu-item ${isActive('/dashboard/conceptos-deuda') ? 'active' : ''}`}>
                <FiFileText className="inline mr-2" /> Concepto Ingreso
              </Link>
              <Link href="/dashboard/reg-deuda" className={`submenu-item ${isActive('/dashboard/reg-deuda') ? 'active' : ''}`}>
                <FiFileText className="inline mr-2" /> Reg Deuda
              </Link>
              <Link href="/dashboard/documento-numeracion" className={`submenu-item ${isActive('/dashboard/documento-numeracion') ? 'active' : ''}`}>
                <FiFileText className="inline mr-2" /> Doc Numeracion
              </Link>
              <Link href="/dashboard/metodo-pago" className={`submenu-item ${isActive('/dashboard/metodo-pago') ? 'active' : ''}`}>
                <FiCreditCard className="inline mr-2" /> Metodo Pago
              </Link>
              <Link href="/dashboard/entidad-recaudadora" className={`submenu-item ${isActive('/dashboard/entidad-recaudadora') ? 'active' : ''}`}>
                <FiTruck className="inline mr-2" /> Entidad Recaudadora
              </Link>
              {showAdminOptions && (
                <Link href="/dashboard/empresa" className={`submenu-item ${isActive('/dashboard/empresa') ? 'active' : ''}`}>
                  <FiBriefcase className="inline mr-2" /> Empresa
                </Link>
              )}
              <Link href="/dashboard/concepto-egreso" className={`submenu-item ${isActive('/dashboard/concepto-egreso') ? 'active' : ''}`}>
                <FiFileText className="inline mr-2" /> Concepto Egreso
              </Link>
              <Link href="/dashboard/recibo-egreso" className={`submenu-item ${isActive('/dashboard/recibo-egreso') ? 'active' : ''}`}>
                <FiDownload className="inline mr-2" /> Recibo Egreso
              </Link>
              <Link href="/dashboard/recibos-ingreso" className={`submenu-item ${isActive('/dashboard/recibos-ingreso') ? 'active' : ''}`}>
                <FiUpload className="inline mr-2" /> Recibo Ingreso
              </Link>
            </div>
          </div>
        )}

        {/* Menú Reportes */}
        {showReportes && (
          <div className="menu-group">
            <div 
              className="menu-label" 
              onClick={() => toggleMenu('menu-3')}
            >
              <div className="menu-label-content">
                <FiBarChart2 className="menu-icon" />
                <span className="menu-text">Reportes</span>
              </div>
              <FiChevronDown className={`menu-arrow ${activeMenu === 'menu-3' ? 'rotated' : ''}`} />
            </div>
            <div 
              ref={el => submenuRefs.current['menu-3'] = el}
              className={`submenu ${activeMenu === 'menu-3' ? 'expanded' : ''}`}
            >
              <Link href="/dashboard/reportes/recibo-ingreso" className={`submenu-item ${isActive('/dashboard/reportes/recibo-ingreso') ? 'active' : ''}`}>
                <FiPieChart className="inline mr-2" /> Reporte Recibo Ingreso
              </Link>
               <Link href="/dashboard/reportes/recibo-egreso" className={`submenu-item ${isActive('/dashboard/reportes/recibo-egreso') ? 'active' : ''}`}>
                <FiPieChart className="inline mr-2" /> Reporte Recibo Egreso
              </Link>
               <Link href="/dashboard/reportes/reporte-arqueo-caja" className={`submenu-item ${isActive('/dashboard/reportes/reporte-arqueo-caja') ? 'active' : ''}`}>
                <FiPieChart className="inline mr-2" /> Arqueo de Caja
              </Link>
             
            </div>
          </div>
        )}

        {/* Menú Mantenimiento */}
        {showMantenimiento && (
          <div className="menu-group">
            <div 
              className="menu-label" 
              onClick={() => toggleMenu('menu-4')}
            >
              <div className="menu-label-content">
                <FiBarChart2 className="menu-icon" />
                <span className="menu-text">Mantenimiento</span>
              </div>
              <FiChevronDown className={`menu-arrow ${activeMenu === 'menu-4' ? 'rotated' : ''}`} />
            </div>
            <div 
              ref={el => submenuRefs.current['menu-4'] = el}
              className={`submenu ${activeMenu === 'menu-4' ? 'expanded' : ''}`}
            >
             <Link href="/dashboard/backups" className={`submenu-item ${isActive('/dashboard/backups') ? 'active' : ''}`}>
                 <FiHardDrive className="inline mr-2" /> Backup BD
              </Link>
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}