"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { offerService, Offer, OfferStats } from '@/lib/api/offerService';
import { useAuth } from '@/lib/auth/authContext';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

const OfferCard = ({ offer, type, onViewDetails }: { 
  offer: Offer; 
  type: 'made' | 'received'; 
  onViewDetails: (offerId: string) => void;
}) => {
  const router = useRouter();
  const statusColor = offerService.getOfferStatusColor(offer.status);
  const statusText = offerService.getOfferStatusText(offer.status);
  const isCountered = offer.status === 'COUNTERED';
  const hasUnreadMessages = offer.messages && offer.messages.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'COUNTERED': return <RefreshCw className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-0 ring-1 ring-gray-200 dark:ring-gray-700">
        {hasUnreadMessages && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Property Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={offer.property.images[0] || '/placeholder.svg'} 
                alt={offer.property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Offer Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground truncate">
                    {offer.property.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {offer.property.location}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1 bg-${statusColor}-50 text-${statusColor}-700 border-${statusColor}-200 dark:bg-${statusColor}-900/20 dark:text-${statusColor}-400`}
                >
                  {getStatusIcon(offer.status)}
                  <span className="text-xs">{statusText}</span>
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {type === 'made' ? 'Your Offer' : 'Their Offer'}:
                  </span>
                  <span className="font-semibold text-foreground">
                    ₦{offer.amount.toLocaleString()}
                  </span>
                </div>

                {offer.property.price !== offer.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Listed Price:</span>
                    <span className="text-sm text-muted-foreground">
                      ₦{offer.property.price.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {type === 'made' ? `To: ${offer.seller.name}` : `From: ${offer.buyer.name}`}
                  </span>
                  <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                </div>

                {isCountered && offer.counterOffers && offer.counterOffers[0] && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mt-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-400">
                        Counter: ₦{offer.counterOffers[0].amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(offer.offerId)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </Button>

                {hasUnreadMessages && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(offer.offerId)}
                    className="flex items-center gap-1 text-blue-600"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {offer.messages?.length} New
                  </Button>
                )}

                {offer.status === 'ACCEPTED' && type === 'made' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => router.push(`/payment?offerId=${offer.offerId}`)}
                  >
                    Proceed to Payment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatsCard = ({ title, value, change, icon: Icon, color }: {
  title: string;
  value: number;
  change?: number;
  icon: any;
  color: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function OffersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'made' | 'received'>('all');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    fetchData();
  }, [user, router, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersResponse, statsResponse] = await Promise.all([
        offerService.getUserOffers(activeTab === 'all' ? 'all' : activeTab),
        offerService.getOfferStats()
      ]);
      
      setOffers(offersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load offers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (offerId: string) => {
    router.push(`/offers/${offerId}`);
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchQuery || 
      offer.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.property.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.amount - a.amount;
    }
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Offers</h1>
            <p className="text-muted-foreground">Manage your property offers and negotiations</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Offers Made"
              value={stats.made.total}
              icon={TrendingUp}
              color="blue"
            />
            <StatsCard
              title="Offers Received"
              value={stats.received.total}
              icon={TrendingDown}
              color="green"
            />
            <StatsCard
              title="Pending Response"
              value={stats.made.pending + stats.received.pending}
              icon={Clock}
              color="orange"
            />
            <StatsCard
              title="Accepted"
              value={stats.made.accepted + stats.received.accepted}
              icon={CheckCircle}
              color="emerald"
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search offers by property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COUNTERED">Countered</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'date' | 'amount') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="amount">By Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Offers Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Offers ({(stats?.made?.total || 0) + (stats?.received?.total || 0)})</TabsTrigger>
            <TabsTrigger value="made">Made by Me ({stats?.made.total || 0})</TabsTrigger>
            <TabsTrigger value="received">Received ({stats?.received.total || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Loading offers...</span>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Offers Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters to see more offers.'
                    : 'You haven\'t made or received any offers yet.'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => router.push('/')}>
                    Browse Properties
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredOffers.map((offer, index) => {
                    const type = offer.buyerId === user.id ? 'made' : 'received';
                    return (
                      <OfferCard
                        key={offer.offerId}
                        offer={offer}
                        type={type}
                        onViewDetails={handleViewDetails}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}