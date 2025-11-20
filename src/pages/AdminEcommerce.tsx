import { useState } from "react";
interface Category {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Settings, DollarSign, Package, TrendingUp, Users } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  sales: number;
}

interface Sale {
  id: number;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
}

export default function AdminEcommerce() {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Plano Básico", category: "Planos", price: 29.90, stock: 999, status: "Ativo", sales: 45 },
    { id: 2, name: "Plano Pro", category: "Planos", price: 59.90, stock: 999, status: "Ativo", sales: 32 },
    { id: 3, name: "Plano Enterprise", category: "Planos", price: 99.90, stock: 999, status: "Ativo", sales: 18 },
    { id: 4, name: "Suporte Premium", category: "Serviços", price: 149.90, stock: 50, status: "Ativo", sales: 12 },
    { id: 5, name: "Consultoria", category: "Serviços", price: 299.90, stock: 20, status: "Ativo", sales: 8 },
  ]);

  const [recentSales, setRecentSales] = useState<Sale[]>([
    { id: 1, customer: "João Silva", product: "Plano Pro", amount: 59.90, date: "2024-01-20", status: "Pago" },
    { id: 2, customer: "Maria Santos", product: "Plano Básico", amount: 29.90, date: "2024-01-19", status: "Pago" },
    { id: 3, customer: "Pedro Oliveira", product: "Suporte Premium", amount: 149.90, date: "2024-01-18", status: "Pendente" },
    { id: 4, customer: "Ana Costa", product: "Plano Enterprise", amount: 99.90, date: "2024-01-17", status: "Pago" },
    { id: 5, customer: "Carlos Lima", product: "Consultoria", amount: 299.90, date: "2024-01-16", status: "Pago" },
  ]);

  const [ecommerceConfig, setEcommerceConfig] = useState({
    storeName: "SaaS Pro Store",
    currency: "BRL",
    taxRate: "10",
    enableReviews: true,
    enableWishlist: true,
    enableCoupons: true,
    autoStock: true
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: ""
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Categorias
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Planos" },
    { id: 2, name: "Serviços" },
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Clientes
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: "João Silva", email: "joao@email.com", phone: "11999999999", status: "Ativo" },
    { id: 2, name: "Maria Santos", email: "maria@email.com", phone: "11988888888", status: "Ativo" },
    { id: 3, name: "Pedro Oliveira", email: "pedro@email.com", phone: "11977777777", status: "Inativo" },
  ]);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", status: "Ativo" });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  // Filtros
  const [productFilter, setProductFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  // CRUD Categoria
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { id: Date.now(), name: newCategory.trim() }]);
      setNewCategory("");
      setIsCategoryDialogOpen(false);
    }
  };
  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  // CRUD Cliente
  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      setCustomers([...customers, { ...newCustomer, id: Date.now() }]);
      setNewCustomer({ name: "", email: "", phone: "", status: "Ativo" });
      setIsCustomerDialogOpen(false);
    }
  };
  const handleDeleteCustomer = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price) {
      const product: Product = {
        id: products.length + 1,
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        status: "Ativo",
        sales: 0
      };
      setProducts([...products, product]);
      setNewProduct({ name: "", category: "", price: "", stock: "" });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const toggleProductStatus = (id: number) => {
    setProducts(products.map(product => 
      product.id === id 
        ? { ...product, status: product.status === "Ativo" ? "Inativo" : "Ativo" }
        : product
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
      case "Pago":
        return "bg-green-100 text-green-800";
      case "Inativo":
      case "Cancelado":
        return "bg-red-100 text-red-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalRevenue = recentSales
    .filter(sale => sale.status === "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);

  const totalProducts = products.length;
  const activeProducts = products.filter(product => product.status === "Ativo").length;

  // Filtro de produtos
  const filteredProducts = productFilter
    ? products.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase()) || p.category.toLowerCase().includes(productFilter.toLowerCase()))
    : products;

  // Filtro de clientes
  const filteredCustomers = customerFilter
    ? customers.filter(c => c.name.toLowerCase().includes(customerFilter.toLowerCase()) || c.email.toLowerCase().includes(customerFilter.toLowerCase()))
    : customers;

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-[#09090b] p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">E-commerce</h1>
          <p className="text-gray-400 text-sm sm:text-base">Gerencie produtos, vendas e configurações da loja</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-[#1f2937] text-white border-none h-10 sm:h-auto">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurações</span>
                <span className="sm:hidden">Config</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1f2937] text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurações da Loja</DialogTitle>
                <DialogDescription>
                  Configure as opções da sua loja virtual
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-gray-300">Nome da Loja</Label>
                    <Input
                      id="storeName"
                      value={ecommerceConfig.storeName}
                      onChange={(e) => setEcommerceConfig({...ecommerceConfig, storeName: e.target.value})}
                      className="bg-[#1f2937] border border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-gray-300">Moeda</Label>
                    <Input
                      id="currency"
                      value={ecommerceConfig.currency}
                      onChange={(e) => setEcommerceConfig({...ecommerceConfig, currency: e.target.value})}
                      className="bg-[#1f2937] border border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-gray-300">Taxa de Imposto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={ecommerceConfig.taxRate}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, taxRate: e.target.value})}
                    className="bg-[#1f2937] border border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableReviews" className="text-gray-300">Habilitar Avaliações</Label>
                    <Switch 
                      id="enableReviews" 
                      checked={ecommerceConfig.enableReviews} 
                      onCheckedChange={(checked) => setEcommerceConfig({...ecommerceConfig, enableReviews: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableWishlist" className="text-gray-300">Habilitar Lista de Desejos</Label>
                    <Switch 
                      id="enableWishlist" 
                      checked={ecommerceConfig.enableWishlist} 
                      onCheckedChange={(checked) => setEcommerceConfig({...ecommerceConfig, enableWishlist: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableCoupons" className="text-gray-300">Habilitar Cupons</Label>
                    <Switch 
                      id="enableCoupons" 
                      checked={ecommerceConfig.enableCoupons} 
                      onCheckedChange={(checked) => setEcommerceConfig({...ecommerceConfig, enableCoupons: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoStock" className="text-gray-300">Controle Automático de Estoque</Label>
                    <Switch 
                      id="autoStock" 
                      checked={ecommerceConfig.autoStock} 
                      onCheckedChange={(checked) => setEcommerceConfig({...ecommerceConfig, autoStock: checked})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="bg-[#1f2937] text-white" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={() => setIsConfigDialogOpen(false)}>
                  Salvar Configurações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-[#7e22ce] hover:bg-[#6d1bb7] text-white">
                <Plus className="w-4 h-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1f2937] text-white">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogDescription>
                  Adicione um novo produto à loja
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-gray-300">Nome do Produto</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Ex: Plano Pro"
                    className="bg-[#1f2937] border border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCategory" className="text-gray-300">Categoria</Label>
                  <Input
                    id="productCategory"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    placeholder="Ex: Planos"
                    className="bg-[#1f2937] border border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productPrice" className="text-gray-300">Preço</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="Ex: 59.90"
                    className="bg-[#1f2937] border border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productStock" className="text-gray-300">Estoque</Label>
                  <Input
                    id="productStock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="Ex: 100"
                    className="bg-[#1f2937] border border-gray-700 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="bg-[#1f2937] text-white" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={handleAddProduct}>
                  Adicionar Produto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Categorias */}
              <Card className="bg-[#1f2937] text-white mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">Categorias
                    <Button size="sm" className="bg-blue-600 ml-2" onClick={() => setIsCategoryDialogOpen(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {categories.map(cat => (
                      <li key={cat.id} className="flex items-center justify-between border-b border-gray-700 py-1">
                        <span>{cat.name}</span>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => handleDeleteCategory(cat.id)}>Excluir</Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="bg-[#1f2937] text-white">
                  <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    <Label>Nome da Categoria</Label>
                    <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-[#1f2937] border border-gray-700 text-white" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="bg-[#1f2937] text-white" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-blue-600" onClick={handleAddCategory}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-400">
              Este mês
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProducts}</div>
            <p className="text-xs text-gray-400">
              {activeProducts} ativos
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentSales.length}</div>
            <p className="text-xs text-gray-400">
              Este mês
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">156</div>
            <p className="text-xs text-gray-400">
              Ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">Produtos
              <Input placeholder="Buscar..." value={productFilter} onChange={e => setProductFilter(e.target.value)} className="ml-4 w-40 bg-gray-800 border-gray-700 text-white" />
            </CardTitle>
            <CardDescription className="text-gray-400">Gerencie todos os produtos da loja</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-gray-400">
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-[#232a36] transition-colors">
                    <TableCell className="font-medium text-white">{product.name}</TableCell>
                    <TableCell className="text-gray-300">{product.category}</TableCell>
                    <TableCell className="text-gray-300">R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{product.stock}</TableCell>
                    <TableCell className="text-gray-300">{product.sales}</TableCell>
                    <TableCell>
                      <Badge className={
                        product.status === 'Ativo' ? 'bg-green-700 text-green-200' :
                        product.status === 'Inativo' ? 'bg-red-700 text-red-200' :
                        'bg-gray-700 text-gray-300'
                      }>{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => toggleProductStatus(product.id)}>
                          {product.status === "Ativo" ? "Desativar" : "Ativar"}
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => handleDeleteProduct(product.id)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Clientes */}
        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">Clientes
              <Input placeholder="Buscar..." value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="ml-4 w-40 bg-gray-800 border-gray-700 text-white" />
              <Button size="sm" className="bg-green-600 ml-2" onClick={() => setIsCustomerDialogOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription className="text-gray-400">Gerencie os clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-gray-400">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-[#232a36] transition-colors">
                    <TableCell className="font-medium text-white">{customer.name}</TableCell>
                    <TableCell className="text-gray-300">{customer.email}</TableCell>
                    <TableCell className="text-gray-300">{customer.phone}</TableCell>
                    <TableCell>
                      <Badge className={
                        customer.status === 'Ativo' ? 'bg-green-700 text-green-200' :
                        customer.status === 'Inativo' ? 'bg-red-700 text-red-200' :
                        'bg-gray-700 text-gray-300'
                      }>{customer.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => handleDeleteCustomer(customer.id)}>
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="bg-[#1f2937] text-white">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label>Nome</Label>
              <Input value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="bg-[#1f2937] border border-gray-700 text-white" />
              <Label>Email</Label>
              <Input value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="bg-[#1f2937] border border-gray-700 text-white" />
              <Label>Telefone</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="bg-[#1f2937] border border-gray-700 text-white" />
              <Label>Status</Label>
              <select value={newCustomer.status} onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value })} className="w-full bg-[#1f2937] border border-gray-700 text-white rounded px-3 py-2">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-[#1f2937] text-white" onClick={() => setIsCustomerDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600" onClick={handleAddCustomer}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Vendas Recentes</CardTitle>
            <CardDescription className="text-gray-400">
              Últimas transações da loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-gray-400">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-[#232a36] transition-colors">
                    <TableCell className="font-medium text-white">{sale.customer}</TableCell>
                    <TableCell className="text-gray-300">{sale.product}</TableCell>
                    <TableCell className="text-gray-300">R$ {sale.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{sale.date}</TableCell>
                    <TableCell>
                      <Badge className={
                        sale.status === 'Pago' ? 'bg-green-700 text-green-200' :
                        sale.status === 'Cancelado' ? 'bg-red-700 text-red-200' :
                        sale.status === 'Pendente' ? 'bg-yellow-700 text-yellow-200' :
                        'bg-gray-700 text-gray-300'
                      }>{sale.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 