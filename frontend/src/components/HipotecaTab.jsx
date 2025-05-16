import React, { useState, useEffect } from "react";
import "./HipotecaTab.css";
import { useTranslation } from 'react-i18next'; // Add translation import

const HipotecaTab = ({ precio }) => {
  const { t } = useTranslation(); // Add translation hook
  const [entrada, setEntrada] = useState(20);
  const [plazo, setPlazo] = useState(30);
  const [interes, setInteres] = useState(3.5);
  const [cuotaMensual, setCuotaMensual] = useState(0);
  const [resumenHipoteca, setResumenHipoteca] = useState({});

  const entradaEuros = Math.round(precio * (entrada / 100));

  useEffect(() => {
    const calcularCuota = () => {
      const entradaDecimal = entrada / 100;
      const capital = precio * (1 - entradaDecimal);
      const interesMensual = interes / 100 / 12;
      const nPagos = plazo * 12;

      const cuota =
        (capital * interesMensual) /
        (1 - Math.pow(1 + interesMensual, -nPagos));
      setCuotaMensual(Math.round(cuota));
    };

    calcularCuota();

    const impuestos = Math.round(precio * 0.1); // 10% impuestos
    const totalInicial = entradaEuros + impuestos;
    const capitalFinanciado = precio - entradaEuros;
    const totalDevolver = cuotaMensual * plazo * 12;
    const interesesTotales = totalDevolver - capitalFinanciado;

    setResumenHipoteca({
      entradaEuros,
      capitalFinanciado,
      impuestos,
      totalInicial,
      totalDevolver,
      interesesTotales,
    });
  }, [precio, entrada, plazo, interes, entradaEuros, cuotaMensual]);

  return (
    <div className="hipoteca-tab">
      <div className="hipoteca-row-1">
        <div className="hipoteca-slider">
          <label>💰 {t('mortgage.downPayment', 'Entrada')}</label>
          <div className="slider-row">
            <input
              type="range"
              min="20"
              max="60"
              step="5"
              value={entrada}
              onChange={(e) => setEntrada(Number(e.target.value))}
            />
            <div className="slider-values">
              <span>{entrada}%</span>
              <span>{entradaEuros.toLocaleString()} €</span>
            </div>
          </div>
        </div>
      </div>
      <div className="hipoteca-row">
        <div className="hipoteca-slider">
          <label>📅 {t('mortgage.term', 'Plazo')} ({t('mortgage.years', 'Años')})</label>
          <div className="slider-row">
            <input
              className="slider-hipoteca"
              type="range"
              min="5"
              max="40"
              step="5"
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
            />
            <span>{plazo}</span>
          </div>
        </div>
        <div className="hipoteca-slider">
          <label>🏦 {t('mortgage.interestRate', 'Interés TIN')}</label>
          <div className="slider-row">
            <input
              className="slider-hipoteca"
              type="range"
              min="1.5"
              max="10"
              step="0.5"
              value={interes}
              onChange={(e) => setInteres(Number(e.target.value))}
            />
            <span>{interes.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="hipoteca-resultado">
        <div className="hipoteca-resultado-block">
          <p>{t('mortgage.youWillPay', 'Pagarás')}</p>
          <span>{cuotaMensual.toLocaleString()} €</span>
        </div>
        <div className="hipoteca-resultado-block">
          <p>{t('mortgage.per', 'al')}</p>
          <span>{t('mortgage.month', 'mes')}</span>
        </div>
        <div className="hipoteca-resultado-block">
          <p>{t('mortgage.for', 'durante')}</p>
          <span>{plazo} {t('mortgage.years', 'años')}</span>
        </div>
      </div>
      <div className="hipoteca-resumen">
        <h4>🧾 {t('mortgage.loanSummary', 'Resumen del préstamo')}</h4>
        <ul>
          <li>
            💰 <strong>{t('mortgage.price', 'Precio')}:</strong> {precio.toLocaleString()} €
          </li>
          <li>
            🔑 <strong>{t('mortgage.downPayment', 'Entrada')}:</strong>{" "}
            {resumenHipoteca.entradaEuros?.toLocaleString()} €
          </li>
          <li>
            🏛️ <strong>{t('mortgage.taxes', 'Impuestos')}:</strong>{" "}
            {resumenHipoteca.impuestos?.toLocaleString()} €
          </li>
          <li>
            💳 <strong>{t('mortgage.initialTotal', 'Total inicial')}:</strong>{" "}
            {resumenHipoteca.totalInicial?.toLocaleString()} €
          </li>
          <li>
            🏦 <strong>{t('mortgage.financedCapital', 'Capital financiado')}:</strong>{" "}
            {resumenHipoteca.capitalFinanciado?.toLocaleString()} €
          </li>
          <li>
            📆 <strong>{t('mortgage.monthlyPayment', 'Cuota mensual')}:</strong> {cuotaMensual?.toLocaleString()}{" "}
            €
          </li>
          <li>
            🧮 <strong>{t('mortgage.totalRepayment', 'Total a devolver')}:</strong>{" "}
            {resumenHipoteca.totalDevolver?.toLocaleString()} €
          </li>
          <li>
            💥 <strong>{t('mortgage.totalInterest', 'Intereses totales')}:</strong>{" "}
            {resumenHipoteca.interesesTotales?.toLocaleString()} €
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HipotecaTab;
