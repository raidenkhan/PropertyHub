import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  Req, 
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { PropertyService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertySearchDto, PropertyFilterDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express/multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { multerConfig } from '../config/multer.config';
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertyService: PropertyService
    , private readonly cloudinaryService: CloudinaryService
  ) {}


 @Get('search/advanced')
  async searchProperties(@Query() searchDto: PropertySearchDto) {
    try {
      const properties = await this.propertyService.searchProperties(searchDto);
      
      return {
        status: 'success',
        data: properties.properties,
        pagination: properties.pagination,
        filters: searchDto,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get user's own properties - MOVED UP
   */
  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  async getMyProperties(@Req() req, @Query() query: PropertyFilterDto) {
    try {
      const properties = await this.propertyService.getPropertiesByOwner(
        req.user.userId,
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 10,
          status: query.status,
        }
      );
      
      return {
        status: 'success',
        data: properties.properties,
        pagination: properties.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get all properties (admin view) - MOVED UP
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async getAllPropertiesAdmin(@Query() query: PropertyFilterDto) {
    try {
      const properties = await this.propertyService.getAllPropertiesAdmin({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        status: query.status,
        type: query.type,
        search: query.search,
      });
      
      return {
        status: 'success',
        data: properties.properties,
        pagination: properties.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get pending properties for verification - MOVED UP
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async getPendingProperties() {
    try {
      const properties = await this.propertyService.getPendingProperties();
      
      return {
        status: 'success',
        data: properties,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get property statistics (admin dashboard) - MOVED UP
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async getPropertyStats() {
    try {
      const stats = await this.propertyService.getPropertyStats();
      
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get properties by location - MOVED UP
   */
  @Get('location/:location')
  async getPropertiesByLocation(
    @Param('location') location: string,
    @Query() query: PropertyFilterDto
  ) {
    try {
      const properties = await this.propertyService.getPropertiesByLocation(
        location,
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 20,
          type: query.type,
        }
      );
      
      return {
        status: 'success',
        data: properties.properties,
        pagination: properties.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // === GENERAL ROUTES ===

  @Get()
  async findAll(@Query() query: PropertyFilterDto) {
    try {
      const properties = await this.propertyService.searchProperties({
        type: query.type,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
      });

      return {
        status: 'success',
        data: properties.properties,
        pagination: properties.pagination,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('USER')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 },
  ], multerConfig))
  async create(
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Body('propertyData') propertyData: string,
    @Req() req,
  ) {
    try {
      const createPropertyDto = JSON.parse(propertyData);
      let imageUrls: string[] = [];

      if (files?.images && files.images.length > 0) {
        imageUrls = await this.cloudinaryService.uploadImages(files.images);
      }

      const property = await this.propertyService.createProperty(req.user.userId, {
        ...createPropertyDto,
        images: imageUrls,
      });

      return {
        status: 'success',
        message: 'Property created successfully',
        property,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // === PARAMETERIZED ROUTES (MUST COME AFTER SPECIFIC ROUTES) ===



  /**
   * Get property history (public for transparency)
   */
  @Get(':id/history')
  async getPropertyHistory(@Param('id') id:string) {
    try {
      const history = await this.propertyService.getPropertyHistory(id);
      
      return {
        status: 'success',
        data: history,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Check if user can edit property
   */
  @Get(':id/can-edit')
  @UseGuards(JwtAuthGuard)
  async canEditProperty(@Param('id', ParseIntPipe) id: number, @Req() req) {
    try {
      const canEdit = await this.propertyService.canUserEditProperty(id, req.user.userId);
      
      return {
        status: 'success',
        data: {
          can_edit: canEdit.canEdit,
          reason: canEdit.reason,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get similar properties
   */
  @Get(':id/similar')
  async getSimilarProperties(@Param('id', ParseIntPipe) id: number) {
    try {
      const properties = await this.propertyService.getSimilarProperties(id);
      
      return {
        status: 'success',
        data: properties,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
@Post(':id/like')
@UseGuards(JwtAuthGuard)
async togglePropertyLike(
  @Param('id') id: string,
  @Req() req
) {
  
  try {
    const result = await this.propertyService.togglePropertyLike(
      req.user.userId,
      id
    );
    
    return {
      status: 'success',
      message: result.liked ? 'Property liked successfully' : 'Property unliked successfully',
      data: result,
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

 /**
   * Submit property for verification
   */
  @Patch(':id/submit-for-verification')
  @UseGuards(JwtAuthGuard)
  async submitForVerification(@Param('id') id: string, @Req() req) {
    try {
      const property = await this.propertyService.submitForVerification(id, req.user.userId);
      
      return {
        status: 'success',
        message: 'Property submitted for verification',
        data: property,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }

}
// ADD THESE ENDPOINTS TO YOUR EXISTING PropertiesController class

/**
 * Toggle like status for a property
*/

/**
 * Check if property is liked by user
 */
@Get(':id/liked')
@UseGuards(JwtAuthGuard)
async isPropertyLiked(
  @Param('id') id: string,
  @Req() req
) {
  try {
    const isLiked = await this.propertyService.isPropertyLiked(
      req.user.userId,
      id
    );
    
    return {
      status: 'success',
      data: { isLiked },
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

  /**
   * List property for sale (owner only)
   */
  @Patch(':id/list')
  @UseGuards(JwtAuthGuard)
  async listProperty(@Param('id') id: string, @Req() req) {
    try {
      const property = await this.propertyService.listProperty(id, req.user.userId);
      
      return {
        status: 'success',
        message: 'Property listed successfully',
        data: property,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delist property (owner only)
   */
  @Patch(':id/delist')
  @UseGuards(JwtAuthGuard)
  async delistProperty(@Param('id') id: string, @Req() req) {
    try {
      const property = await this.propertyService.delistProperty(id, req.user.userId);
      
      return {
        status: 'success',
        message: 'Property delisted successfully',
        data: property,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  /**
   * Update property (only owner or admin)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdatePropertyDto, 
    @Req() req
  ) {
    try {
      console.log('ID found',id)
      
      const property = await this.propertyService.update(id, dto, req.user.userId);
      
      return {
        status: 'success',
        message: 'Property updated successfully',
        data: property,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

 

/**
 * Get user's wishlist (liked properties)
 */
@Get('wishlist')
@UseGuards(JwtAuthGuard)
async getUserWishlist(
  @Req() req,
  @Query() query: PropertyFilterDto
) {
  try {
    const wishlist = await this.propertyService.getUserWishlist(
      req.user.userId,
      {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        search: query.search,
        type: query.type,
        //minPrice: query.minPrice,
       // maxPrice: query.maxPrice,
      }
    );
    
    return {
      status: 'success',
      data: wishlist.properties,
      pagination: wishlist.pagination,
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}


/**
 * Update your existing findOne method to include like status
 */
@Get(':id')
async findOne(@Param('id') id: string, @Req() req?) {
  try {
    const property = await this.propertyService.findOne(id);
    
    // If user is authenticated, check like status
    if (req?.user?.userId) {
      const isLiked = await this.propertyService.isPropertyLiked(
        req.user.userId,
        property.propertyId
      );
      
      return {
        status: 'success',
        data: {
          ...property,
          isLiked,
          likesCount: property.likesCount || 0
        },
      };
    }
    
    return {
      status: 'success',
      data: {
        ...property,
        isLiked: false,
        likesCount: property.likesCount || 0
      },
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}
}