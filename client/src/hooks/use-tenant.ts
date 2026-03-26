/**
 * useTenant — Multi-tenant context hook
 * Retorna contexto da empresa atual e helpers de isolação de dados.
 *
 * LGPD: Dados de mock/demonstração são visíveis APENAS para administradores.
 * Usuários regulares sempre veem apenas dados reais da sua empresa.
 */

import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getAllUnits } from "@/lib/api";
import { ValidatedTenantData, VALIDATED_DATA_KEY } from "@/lib/assessment-mapper";
import { useState, useEffect } from "react";

export interface TenantContext {
  /** true quando o usuário logado tem role === "admin" */
  isAdmin: boolean;
  /** Nome da empresa/unidade do usuário logado */
  companyName: string;
  /** Código/sigla da unidade (campo unit do profile) */
  unitLabel: string;
  /** Dados validados da avaliação ONA (null se ainda não validado) */
  validatedData: ValidatedTenantData | null;
  /**
   * Resolve dados para exibição respeitando LGPD:
   * - Se dbData tiver registros → retorna dbData mapeado
   * - Se dbData vazio + admin → retorna mockData (para demo)
   * - Se dbData vazio + usuário regular → retorna [] (estado limpo)
   */
  resolveData: <T>(dbData: any[] | undefined, mapFn: (item: any) => T, mockData: T[]) => T[];
  /**
   * Versão simples sem mapeamento:
   * - dbData com registros → dbData
   * - dbData vazio + admin → mockData
   * - dbData vazio + usuário com dados validados → validatedItems
   * - dbData vazio + usuário sem validação → []
   */
  resolvePlain: <T>(dbData: T[] | undefined, mockData: T[], validatedItems?: T[]) => T[];
}

export function useTenant(): TenantContext {
  const { currentUser } = useStore();
  const isAdmin = currentUser?.role === "admin";

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: getAllUnits,
    staleTime: 300_000,
    enabled: !!currentUser,
  });

  // Encontra a empresa do usuário pelo campo unit (string)
  const userUnit = currentUser?.unit ?? "";
  const matchedUnit = units?.find(
    (u: any) =>
      u.cnpj === userUnit ||
      u.nomeFantasia?.toLowerCase() === userUnit.toLowerCase() ||
      u.razaoSocial?.toLowerCase() === userUnit.toLowerCase() ||
      String(u.id) === userUnit
  );

  const companyName =
    matchedUnit?.nomeFantasia ||
    matchedUnit?.razaoSocial ||
    (isAdmin ? "Administrador — Todas as Empresas" : userUnit || "Empresa");

  // Read validated assessment data from localStorage with reactivity
  const readValidatedData = (): ValidatedTenantData | null => {
    try {
      const raw = localStorage.getItem(VALIDATED_DATA_KEY);
      return raw ? (JSON.parse(raw) as ValidatedTenantData) : null;
    } catch {
      return null;
    }
  };

  const [validatedData, setValidatedData] = useState<ValidatedTenantData | null>(readValidatedData);

  // Re-read when sector forms or assessment validation dispatches "ona-validated"
  useEffect(() => {
    const handler = () => setValidatedData(readValidatedData());
    window.addEventListener("ona-validated", handler);
    return () => window.removeEventListener("ona-validated", handler);
  }, []);

  const resolveData = <T>(
    dbData: any[] | undefined,
    mapFn: (item: any) => T,
    mockData: T[]
  ): T[] => {
    if (dbData && dbData.length > 0) return dbData.map(mapFn);
    if (isAdmin) return mockData;
    return [];
  };

  const resolvePlain = <T>(dbData: T[] | undefined, mockData: T[], validatedItems?: T[]): T[] => {
    if (dbData && dbData.length > 0) return dbData;
    if (isAdmin) return mockData;
    if (validatedItems && validatedItems.length > 0) return validatedItems;
    return [];
  };

  return {
    isAdmin,
    companyName,
    unitLabel: userUnit,
    validatedData,
    resolveData,
    resolvePlain,
  };
}
