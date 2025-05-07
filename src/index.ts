#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

if (!API_KEY) {
  throw new Error('ALPHA_VANTAGE_API_KEY 环境变量是必需的');
}

const server = new McpServer({
  name: 'alpha-vantage',
  version: '1.0.0',
});

// 定义接口类型
interface AlphaVantageParams {
  function: string;
  symbol?: string;
  outputsize?: string;
  from_currency?: string;
  to_currency?: string;
  market?: string;
  interval?: string;
  [key: string]: string | undefined;  // 允许其他可能的参数
}

// 获取股票价格
server.tool(
  'get_stock_price',
  '获取实时股票价格信息',
  {
    symbol: z.string().describe('股票代码（例如：AAPL）'),
  },
  async ({ symbol }) => {
    const stockData = await makeAlphaVantageRequest({
      function: 'GLOBAL_QUOTE',
      symbol,
    });
    
    if (!stockData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取股票数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stockData, null, 2),
        },
      ],
    };
  },
);

// 获取公司概况
server.tool(
  'get_company_overview',
  '获取公司信息和关键指标',
  {
    symbol: z.string().describe('股票代码（例如：AAPL）'),
  },
  async ({ symbol }) => {
    const companyData = await makeAlphaVantageRequest({
      function: 'OVERVIEW',
      symbol,
    });
    
    if (!companyData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取公司数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(companyData, null, 2),
        },
      ],
    };
  },
);

// 获取每日时间序列
server.tool(
  'get_daily_time_series',
  '获取股票的每日时间序列数据',
  {
    symbol: z.string().describe('股票代码（例如：AAPL）'),
    outputsize: z.enum(['compact', 'full']).default('compact').describe('返回数据量（compact/full）'),
  },
  async ({ symbol, outputsize }) => {
    const timeSeriesData = await makeAlphaVantageRequest({
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize,
    });
    
    if (!timeSeriesData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取时间序列数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(timeSeriesData, null, 2),
        },
      ],
    };
  },
);

// 获取每周时间序列
server.tool(
  'get_weekly_time_series',
  '获取股票的每周时间序列数据',
  {
    symbol: z.string().describe('股票代码（例如：AAPL）'),
  },
  async ({ symbol }) => {
    const weeklyData = await makeAlphaVantageRequest({
      function: 'TIME_SERIES_WEEKLY',
      symbol,
    });
    
    if (!weeklyData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取每周时间序列数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weeklyData, null, 2),
        },
      ],
    };
  },
);

// 获取外汇汇率
server.tool(
  'get_forex_rate',
  '获取货币对的汇率',
  {
    from_currency: z.string().describe('源货币（例如：USD）'),
    to_currency: z.string().describe('目标货币（例如：EUR）'),
  },
  async ({ from_currency, to_currency }) => {
    const forexData = await makeAlphaVantageRequest({
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency,
      to_currency,
    });
    
    if (!forexData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取外汇汇率数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(forexData, null, 2),
        },
      ],
    };
  },
);

// 获取加密货币价格
server.tool(
  'get_crypto_price',
  '获取加密货币价格',
  {
    symbol: z.string().describe('加密货币代码（例如：BTC）'),
    market: z.string().describe('市场货币（例如：USD）'),
  },
  async ({ symbol, market }) => {
    const cryptoData = await makeAlphaVantageRequest({
      function: 'CRYPTO_INTRADAY',
      symbol,
      market,
    });
    
    if (!cryptoData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取加密货币价格数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(cryptoData, null, 2),
        },
      ],
    };
  },
);

// 获取技术指标
server.tool(
  'get_technical_indicator',
  '获取股票的技术指标',
  {
    symbol: z.string().describe('股票代码（例如：AAPL）'),
    indicator: z.string().describe('技术指标（例如：SMA, EMA, RSI）'),
    interval: z.enum(['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly']).default('daily').describe('时间间隔'),
  },
  async ({ symbol, indicator, interval }) => {
    const indicatorData = await makeAlphaVantageRequest({
      function: indicator,
      symbol,
      interval,
    });
    
    if (!indicatorData) {
      return {
        content: [
          {
            type: 'text',
            text: '获取技术指标数据失败',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(indicatorData, null, 2),
        },
      ],
    };
  },
);

async function makeAlphaVantageRequest(params: AlphaVantageParams) {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        ...params,
        apikey: API_KEY,
      },
    });
    
    if (!response.data) {
      throw new Error('无效的响应数据');
    }
    
    return response.data;
  } catch (error) {
    console.error('[错误] 请求 Alpha Vantage API 失败:', error);
    return null;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Alpha Vantage MCP 服务器正在通过 stdio 运行');
}

main().catch((error) => {
  console.error('main() 中的致命错误:', error);
  process.exit(1);
});
