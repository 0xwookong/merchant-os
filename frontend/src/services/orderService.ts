import { api } from "@/lib/api";

interface OrderListItem {
  id: number;
  orderNo: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number | null;
  cryptoCurrency: string | null;
  cryptoNetwork: string | null;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface OrderListPage {
  list: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderListParams {
  status?: string;
  paymentMethod?: string;
  page?: string;
  pageSize?: string;
}

interface OrderDetail {
  id: number;
  orderNo: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number | null;
  cryptoCurrency: string | null;
  cryptoNetwork: string | null;
  walletAddress: string | null;
  paymentMethod: string;
  status: string;
  txHash: string | null;
  blockHeight: number | null;
  confirmations: number | null;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  list(params: OrderListParams = {}): Promise<OrderListPage> {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.paymentMethod) query.paymentMethod = params.paymentMethod;
    query.page = params.page || "1";
    query.pageSize = params.pageSize || "20";
    return api.get<OrderListPage>("/api/v1/orders", query);
  },

  getDetail(id: number): Promise<OrderDetail> {
    return api.get<OrderDetail>(`/api/v1/orders/${id}`);
  },
};

export type { OrderListItem, OrderListPage, OrderListParams, OrderDetail };
