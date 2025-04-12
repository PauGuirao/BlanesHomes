import React, { useState, useEffect } from "react";
import "./HipotecaTab.css";

const HipotecaTab = ({ precio }) => {
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
  }, [precio, entrada, plazo, interes]);

  return (
    <div className="hipoteca-tab">
      <div className="hipoteca-row-1">
        <div className="hipoteca-slider">
          <label>💰 Entrada</label>
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
          <label>📅 Plazo (Años)</label>
          <div className="slider-row">
            <input
              className="slider"
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
          <label>🏦 Interés TIN</label>
          <div className="slider-row">
            <input
              className="slider"
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
          <p>Pagaras</p>
          <span>{cuotaMensual.toLocaleString()} €</span>
        </div>
        <div className="hipoteca-resultado-block">
          <p>al</p>
          <span>mes</span>
        </div>
        <div className="hipoteca-resultado-block">
          <p>durante</p>
          <span>{plazo} años</span>
        </div>
      </div>
      <div className="hipoteca-resumen">
        <h4>🧾 Resumen del préstamo</h4>
        <ul>
          <li>
            💰 <strong>Precio:</strong> {precio.toLocaleString()} €
          </li>
          <li>
            🔑 <strong>Entrada:</strong>{" "}
            {resumenHipoteca.entradaEuros?.toLocaleString()} €
          </li>
          <li>
            🏛️ <strong>Impuestos:</strong>{" "}
            {resumenHipoteca.impuestos?.toLocaleString()} €
          </li>
          <li>
            💳 <strong>Total inicial:</strong>{" "}
            {resumenHipoteca.totalInicial?.toLocaleString()} €
          </li>
          <li>
            🏦 <strong>Capital financiado:</strong>{" "}
            {resumenHipoteca.capitalFinanciado?.toLocaleString()} €
          </li>
          <li>
            📆 <strong>Cuota mensual:</strong> {cuotaMensual?.toLocaleString()}{" "}
            €
          </li>
          <li>
            🧮 <strong>Total a devolver:</strong>{" "}
            {resumenHipoteca.totalDevolver?.toLocaleString()} €
          </li>
          <li>
            💥 <strong>Intereses totales:</strong>{" "}
            {resumenHipoteca.interesesTotales?.toLocaleString()} €
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HipotecaTab;
