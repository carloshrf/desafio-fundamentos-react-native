import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import api from '../services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStore = await AsyncStorage.getItem('@GoMarketPlace:inCart');

      productsStore && setProducts(JSON.parse(productsStore));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function addProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketPlace:inCart',
        JSON.stringify(products),
      );
    }

    addProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productIsInChart = products.find(prod => prod.id === product.id);

      if (productIsInChart) {
        const chart = products.filter(prod => prod.id !== product.id);
        productIsInChart.quantity += 1;
        chart.push(productIsInChart);

        setProducts(chart);
      } else {
        setProducts(state => [...state, { ...product, quantity: 1 }]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const product = products.find((prod: Product) => prod.id === id);
      const allProducts = products.filter(prod => prod.id !== id);

      product && (product.quantity += 1);
      product && allProducts.push(product);

      setProducts(allProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);
      const allProducts = products.filter(prod => prod.id !== id);

      product && (product.quantity -= 1);
      if (product && product.quantity > 0) {
        allProducts.push(product);
      }

      setProducts(allProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
