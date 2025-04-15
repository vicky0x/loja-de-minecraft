import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const healthStatus = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    serverStatus: 'ok',
    databaseStatus: 'unknown',
    databaseLatency: -1,
    responseTime: -1
  };

  try {
    // Verificar conexão com banco de dados
    const dbStartTime = Date.now();
    
    try {
      await connectDB();
      
      // Verifica se a conexão está pronta
      if (mongoose.connection.readyState === 1) {
        healthStatus.databaseStatus = 'connected';
        
        // Testar tempo de resposta da consulta
        const pingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        healthStatus.databaseLatency = Date.now() - pingStart;
      } else {
        healthStatus.databaseStatus = 'disconnected';
      }
    } catch (dbError) {
      healthStatus.databaseStatus = 'error';
      healthStatus.serverStatus = 'degraded';
      console.error('Erro ao conectar com banco de dados:', dbError);
    }
    
    // Calcular tempo de resposta total
    healthStatus.responseTime = Date.now() - startTime;
    
    return NextResponse.json(healthStatus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    healthStatus.serverStatus = 'error';
    healthStatus.responseTime = Date.now() - startTime;
    
    return NextResponse.json(healthStatus, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Type': 'application/json',
      }
    });
  }
} 