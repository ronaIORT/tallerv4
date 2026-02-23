#!/usr/bin/env python3
"""
Validador de Estructura de Datos - Taller de Costura PWA

Este script valida la estructura de archivos del proyecto y la integridad
de los datos en IndexedDB (simulado mediante análisis de código).

Uso:
    python validar_estructura.py

Autor: Equipo Taller de Costura
Versión: 1.0.0
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class Colors:
    """Colores para output en terminal."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class ValidationResult:
    """Resultado de una validación."""
    
    def __init__(self, name: str):
        self.name = name
        self.passed: List[str] = []
        self.failed: List[str] = []
        self.warnings: List[str] = []
    
    def add_pass(self, message: str):
        self.passed.append(message)
    
    def add_fail(self, message: str):
        self.failed.append(message)
    
    def add_warning(self, message: str):
        self.warnings.append(message)
    
    @property
    def is_valid(self) -> bool:
        return len(self.failed) == 0
    
    def print_report(self):
        """Imprime el reporte de validación."""
        status = f"{Colors.GREEN}✓ PASÓ{Colors.RESET}" if self.is_valid else f"{Colors.RED}✗ FALLÓ{Colors.RESET}"
        print(f"\n{Colors.BOLD}=== {self.name} ==={Colors.RESET} {status}")
        
        for msg in self.passed:
            print(f"  {Colors.GREEN}✓{Colors.RESET} {msg}")
        
        for msg in self.failed:
            print(f"  {Colors.RED}✗{Colors.RESET} {msg}")
        
        for msg in self.warnings:
            print(f"  {Colors.YELLOW}⚠{Colors.RESET} {msg}")


class ProjectValidator:
    """Validador principal del proyecto."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.results: List[ValidationResult] = []
    
    def validate_all(self) -> bool:
        """Ejecuta todas las validaciones."""
        print(f"\n{Colors.BLUE}{'='*50}{Colors.RESET}")
        print(f"{Colors.BOLD}  VALIDADOR DE ESTRUCTURA - TALLER DE COSTURA PWA{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*50}{Colors.RESET}\n")
        
        # Ejecutar validaciones
        self.validate_directory_structure()
        self.validate_required_files()
        self.validate_javascript_files()
        self.validate_css_files()
        self.validate_db_schema()
        self.validate_skill_structure()
        
        # Imprimir reportes
        for result in self.results:
            result.print_report()
        
        # Resumen final
        total_passed = sum(1 for r in self.results if r.is_valid)
        total_results = len(self.results)
        
        print(f"\n{Colors.BLUE}{'='*50}{Colors.RESET}")
        if total_passed == total_results:
            print(f"{Colors.GREEN}{Colors.BOLD}  ✓ TODAS LAS VALIDACIONES PASARON ({total_passed}/{total_results}){Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}  ✗ VALIDACIONES FALLIDAS: {total_results - total_passed}/{total_results}{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*50}{Colors.RESET}\n")
        
        return total_passed == total_results
    
    def validate_directory_structure(self):
        """Valida la estructura de directorios del proyecto."""
        result = ValidationResult("Estructura de Directorios")
        
        required_dirs = [
            "css",
            "css/views",
            "js",
            "js/views",
            "js/views/administrar-tareas",
            "icons",
            "taller-costura-context",
            "taller-costura-context/references",
            "taller-costura-context/scripts",
        ]
        
        for dir_path in required_dirs:
            full_path = self.base_path / dir_path
            if full_path.exists() and full_path.is_dir():
                result.add_pass(f"Directorio existe: {dir_path}/")
            else:
                result.add_fail(f"Directorio faltante: {dir_path}/")
        
        self.results.append(result)
    
    def validate_required_files(self):
        """Valida que los archivos requeridos existan."""
        result = ValidationResult("Archivos Requeridos")
        
        required_files = [
            "index.html",
            "manifest.json",
            "service-worker.js",
            "js/app.js",
            "js/db.js",
            "css/style.css",
            "taller-costura-context/SKILL.md",
        ]
        
        for file_path in required_files:
            full_path = self.base_path / file_path
            if full_path.exists() and full_path.is_file():
                result.add_pass(f"Archivo existe: {file_path}")
            else:
                result.add_fail(f"Archivo faltante: {file_path}")
        
        self.results.append(result)
    
    def validate_javascript_files(self):
        """Valida la sintaxis básica de archivos JavaScript."""
        result = ValidationResult("Archivos JavaScript")
        
        js_files = list(self.base_path.glob("js/**/*.js"))
        
        for js_file in js_files:
            rel_path = js_file.relative_to(self.base_path)
            
            try:
                content = js_file.read_text(encoding="utf-8")
                
                # Verificar que use módulos ES6
                if "import " in content or "export " in content:
                    result.add_pass(f"Usa módulos ES6: {rel_path}")
                else:
                    result.add_warning(f"No detectado uso de módulos: {rel_path}")
                
                # Verificar uso de async/await con Dexie
                if "db." in content and "await" in content:
                    result.add_pass(f"Usa async/await con DB: {rel_path}")
                
                # Verificar manejo de errores
                if "try {" in content and "catch" in content:
                    result.add_pass(f"Manejo de errores: {rel_path}")
                
            except Exception as e:
                result.add_fail(f"Error leyendo {rel_path}: {str(e)}")
        
        self.results.append(result)
    
    def validate_css_files(self):
        """Valida archivos CSS."""
        result = ValidationResult("Archivos CSS")
        
        css_files = list(self.base_path.glob("css/**/*.css"))
        
        for css_file in css_files:
            rel_path = css_file.relative_to(self.base_path)
            
            try:
                content = css_file.read_text(encoding="utf-8")
                
                # Verificar uso de variables CSS
                if "--" in content:
                    result.add_pass(f"Usa variables CSS: {rel_path}")
                
                # Verificar media queries (mobile-first)
                if "@media" in content:
                    result.add_pass(f"Responsive: {rel_path}")
                
            except Exception as e:
                result.add_fail(f"Error leyendo {rel_path}: {str(e)}")
        
        self.results.append(result)
    
    def validate_db_schema(self):
        """Valida el schema de la base de datos en db.js."""
        result = ValidationResult("Schema de Base de Datos")
        
        db_file = self.base_path / "js/db.js"
        
        if not db_file.exists():
            result.add_fail("Archivo db.js no encontrado")
            self.results.append(result)
            return
        
        try:
            content = db_file.read_text(encoding="utf-8")
            
            # Verificar tablas requeridas
            required_tables = ["prendas", "trabajadores", "cortes", "pagos"]
            
            for table in required_tables:
                if f'{table}:' in content or f'"{table}"' in content:
                    result.add_pass(f"Tabla definida: {table}")
                else:
                    result.add_fail(f"Tabla faltante: {table}")
            
            # Verificar versión de DB
            version_match = re.search(r'db\.version\((\d+)\)', content)
            if version_match:
                version = version_match.group(1)
                result.add_pass(f"Versión de DB: {version}")
            else:
                result.add_warning("No se detectó versión de DB")
            
            # Verificar seed data
            if 'db.on("populate"' in content or "db.on('populate'" in content:
                result.add_pass("Seed data definido")
            else:
                result.add_warning("No se detectó seed data")
            
            # Verificar índices
            if "++id" in content:
                result.add_pass("Auto-increment definido")
            if "&nombre" in content:
                result.add_pass("Índice único en nombre")
            
        except Exception as e:
            result.add_fail(f"Error analizando db.js: {str(e)}")
        
        self.results.append(result)
    
    def validate_skill_structure(self):
        """Valida la estructura de la Skill de contexto."""
        result = ValidationResult("Estructura de Skill")
        
        skill_dir = self.base_path / "taller-costura-context"
        
        if not skill_dir.exists():
            result.add_fail("Directorio de Skill no existe")
            self.results.append(result)
            return
        
        # Verificar SKILL.md
        skill_file = skill_dir / "SKILL.md"
        if skill_file.exists():
            try:
                content = skill_file.read_text(encoding="utf-8")
                
                # Verificar frontmatter YAML
                if content.startswith("---"):
                    result.add_pass("Frontmatter YAML presente")
                    
                    # Verificar campos requeridos
                    required_fields = ["name:", "description:"]
                    for field in required_fields:
                        if field in content:
                            result.add_pass(f"Campo '{field.strip(':')}' definido")
                        else:
                            result.add_fail(f"Campo '{field.strip(':')}' faltante")
                else:
                    result.add_fail("Frontmatter YAML no encontrado")
                
                # Verificar que el nombre coincide con el directorio
                name_match = re.search(r'^name:\s*(.+)$', content, re.MULTILINE)
                if name_match:
                    skill_name = name_match.group(1).strip()
                    if skill_name == "taller-costura-context":
                        result.add_pass("Nombre de Skill coincide con directorio")
                    else:
                        result.add_fail(f"Nombre de Skill '{skill_name}' no coincide con directorio")
                
            except Exception as e:
                result.add_fail(f"Error leyendo SKILL.md: {str(e)}")
        else:
            result.add_fail("SKILL.md no encontrado")
        
        # Verificar archivos de referencia
        ref_files = [
            "REFERENCE.md",
            "references/ARQUITECTURA.md",
            "references/MODELO_DATOS.md",
            "references/CONVENCIONES.md",
        ]
        
        for ref_file in ref_files:
            full_path = skill_dir / ref_file
            if full_path.exists():
                result.add_pass(f"Referencia existe: {ref_file}")
            else:
                result.add_warning(f"Referencia faltante: {ref_file}")
        
        # Verificar scripts
        scripts_dir = skill_dir / "scripts"
        if scripts_dir.exists():
            scripts = list(scripts_dir.glob("*.py"))
            if scripts:
                result.add_pass(f"Scripts encontrados: {len(scripts)}")
            else:
                result.add_warning("No hay scripts en el directorio")
        
        self.results.append(result)


def validate_data_structure(data: Dict) -> Tuple[bool, List[str]]:
    """
    Valida la estructura de un objeto de datos.
    
    Args:
        data: Diccionario con los datos a validar
    
    Returns:
        Tupla con (es_válido, lista_de_errores)
    """
    errors = []
    
    # Validar prenda
    if "prenda" in data:
        prenda = data["prenda"]
        if not prenda.get("nombre"):
            errors.append("Prenda: nombre es requerido")
        if not isinstance(prenda.get("tareas"), list):
            errors.append("Prenda: tareas debe ser una lista")
        else:
            for i, tarea in enumerate(prenda["tareas"]):
                if not tarea.get("nombre"):
                    errors.append(f"Tarea {i}: nombre es requerido")
                if not isinstance(tarea.get("precioUnitario"), (int, float)):
                    errors.append(f"Tarea {i}: precioUnitario debe ser numérico")
    
    # Validar corte
    if "corte" in data:
        corte = data["corte"]
        if not corte.get("nombrePrenda"):
            errors.append("Corte: nombrePrenda es requerido")
        if not isinstance(corte.get("cantidadPrendas"), (int, float)) or corte["cantidadPrendas"] <= 0:
            errors.append("Corte: cantidadPrendas debe ser un número positivo")
        if corte.get("estado") not in ["activo", "terminado"]:
            errors.append("Corte: estado debe ser 'activo' o 'terminado'")
    
    # Validar trabajador
    if "trabajador" in data:
        trabajador = data["trabajador"]
        if not trabajador.get("nombre"):
            errors.append("Trabajador: nombre es requerido")
    
    # Validar pago
    if "pago" in data:
        pago = data["pago"]
        if not isinstance(pago.get("trabajadorId"), int):
            errors.append("Pago: trabajadorId debe ser un número entero")
        if not isinstance(pago.get("monto"), (int, float)) or pago["monto"] <= 0:
            errors.append("Pago: monto debe ser un número positivo")
    
    return len(errors) == 0, errors


def main():
    """Función principal."""
    # Determinar la ruta base
    script_dir = Path(__file__).parent
    base_path = script_dir.parent.parent  # Subir dos niveles desde scripts/
    
    # Cambiar al directorio base si es necesario
    if not (base_path / "index.html").exists():
        base_path = Path(".")
    
    # Ejecutar validador
    validator = ProjectValidator(str(base_path))
    success = validator.validate_all()
    
    # Retornar código de salida
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())